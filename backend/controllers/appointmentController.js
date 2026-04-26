import Appointment from '../models/Appointment.js'
import Availability from '../models/Availability.js'
import { canUseAppointmentChat } from '../helpers/chatAccess.js'
import PatientProfile from '../models/PatientProfile.js'
import Prescription from '../models/Prescription.js'
import User from '../models/User.js'

const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getDayRange = (dateValue) => {
  const date = new Date(dateValue)
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const parseTimeToMinutes = (time) => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)

  if (!match) {
    return null
  }

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridian = match[3].toUpperCase()

  if (hours === 12) {
    hours = 0
  }

  if (meridian === 'PM') {
    hours += 12
  }

  return (hours * 60) + minutes
}

const formatMinutesToTime = (minutes) => {
  const normalizedHours = Math.floor(minutes / 60)
  const normalizedMinutes = minutes % 60
  const meridian = normalizedHours >= 12 ? 'PM' : 'AM'
  const hour12 = normalizedHours % 12 || 12

  return `${hour12}:${normalizedMinutes.toString().padStart(2, '0')} ${meridian}`
}

const buildSlots = (startTime, endTime, slotDuration) => {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return []
  }

  const slots = []

  for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
    slots.push(formatMinutesToTime(current))
  }

  return slots
}

const getDayLabel = (dateValue) => dayMap[new Date(dateValue).getDay()]

const buildPatientInfo = (user) => ({
  id: user?._id,
  name: user?.name,
  email: user?.email,
})

const buildPatientProfile = (profile) => ({
  age: profile?.age ?? null,
  gender: profile?.gender || '',
  mobile: profile?.mobile || '',
  bloodGroup: profile?.bloodGroup || '',
  diseases: profile?.diseases || '',
  profilePhoto: profile?.profilePhoto || '',
})

const statusTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed'],
}

export const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      date,
      time,
      description = '',
    } = req.body

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        message: 'Doctor, date, and time are required',
      })
    }

    const doctor = await User.findById(doctorId)

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        message: 'Doctor not found',
      })
    }

    if (!doctor.isVerified) {
      return res.status(400).json({
        message: 'This doctor is not currently available for appointment booking',
      })
    }

    const day = getDayLabel(date)

    if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(day)) {
      return res.status(400).json({
        message: 'Appointments can only be booked on the doctor availability days',
      })
    }

    const availability = await Availability.findOne({
      doctorId,
      day,
    })

    if (!availability) {
      return res.status(400).json({
        message: 'Doctor has not opened availability for this date',
      })
    }

    const availableSlots = buildSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
    )

    if (!availableSlots.includes(time)) {
      return res.status(400).json({
        message: 'Selected slot is not part of the doctor schedule',
      })
    }

    const { start, end } = getDayRange(date)
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: {
        $gte: start,
        $lte: end,
      },
      time,
      status: {
        $in: ['pending', 'confirmed'],
      },
    })

    if (existingAppointment) {
      return res.status(409).json({
        message: 'This slot has already been booked',
      })
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: start,
      time,
      description: description.trim(),
      status: 'pending',
    })

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: populatedAppointment,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to book appointment',
    })
  }
}

export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name email specialization')
      .sort({ date: 1, createdAt: -1 })

    return res.status(200).json({
      count: appointments.length,
      appointments: appointments.map((appointment) => ({
        ...appointment.toObject(),
        canChat: canUseAppointmentChat(appointment.status),
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch appointments',
    })
  }
}

export const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user._id })
      .populate('patientId', 'name email')
      .sort({ date: 1, createdAt: -1 })
      .lean()

    const patientIds = appointments.map((appointment) => appointment.patientId?._id).filter(Boolean)
    const patientProfiles = await PatientProfile.find({
      userId: { $in: patientIds },
    }).lean()

    const profileMap = new Map(
      patientProfiles.map((profile) => [String(profile.userId), profile]),
    )

    const appointmentIds = appointments.map((appointment) => appointment._id)
    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    }).lean()

    const prescriptionMap = new Map(
      prescriptions.map((prescription) => [String(prescription.appointmentId), prescription]),
    )

    return res.status(200).json({
      count: appointments.length,
      appointments: appointments.map((appointment) => ({
        ...appointment,
        patient: buildPatientInfo(appointment.patientId),
        patientProfile: buildPatientProfile(profileMap.get(String(appointment.patientId?._id))),
        prescription: prescriptionMap.get(String(appointment._id)) || null,
        canChat: canUseAppointmentChat(appointment.status),
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch doctor appointments',
    })
  }
}

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be confirmed, cancelled, or completed',
      })
    }

    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      })
    }

    if (String(appointment.doctorId) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only update your own appointments',
      })
    }

    const allowedStatuses = statusTransitions[appointment.status] || []

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change appointment status from ${appointment.status} to ${status}`,
      })
    }

    appointment.status = status
    await appointment.save()

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialization')

    return res.status(200).json({
      message: `Appointment ${status} successfully`,
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to update appointment status',
    })
  }
}
