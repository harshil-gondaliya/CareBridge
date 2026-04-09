import Appointment from '../models/Appointment.js'
import Availability from '../models/Availability.js'
import User from '../models/User.js'

const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

const getDayLabel = (dateValue) => {
  const date = new Date(dateValue)
  return dayMap[date.getDay()]
}

const getDayRange = (dateValue) => {
  const date = new Date(dateValue)
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
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

export const setAvailability = async (req, res) => {
  try {
    const {
      day,
      startTime = '11:00 AM',
      endTime = '5:00 PM',
      slotDuration = 30,
    } = req.body

    if (!day) {
      return res.status(400).json({
        message: 'Day is required',
      })
    }

    if (parseTimeToMinutes(startTime) === null || parseTimeToMinutes(endTime) === null) {
      return res.status(400).json({
        message: 'Start time and end time must use the format 11:00 AM',
      })
    }

    if (parseTimeToMinutes(startTime) >= parseTimeToMinutes(endTime)) {
      return res.status(400).json({
        message: 'End time must be later than start time',
      })
    }

    const availability = await Availability.findOneAndUpdate(
      {
        doctorId: req.user._id,
        day,
      },
      {
        doctorId: req.user._id,
        day,
        startTime,
        endTime,
        slotDuration: Number(slotDuration) || 30,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.status(200).json({
      message: 'Availability saved successfully',
      availability,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to save availability',
    })
  }
}

export const getDoctorAvailability = async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({
        message: 'Date is required to fetch slots',
      })
    }

    const doctor = await User.findById(req.params.doctorId)

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        message: 'Doctor not found',
      })
    }

    const day = getDayLabel(date)

    if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(day)) {
      return res.status(200).json({
        day,
        slots: [],
        availability: null,
      })
    }

    const availability = await Availability.findOne({
      doctorId: req.params.doctorId,
      day,
    })

    if (!availability) {
      return res.status(200).json({
        day,
        slots: [],
        availability: null,
      })
    }

    const baseSlots = buildSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
    )

    const { start, end } = getDayRange(date)
    const bookedAppointments = await Appointment.find({
      doctorId: req.params.doctorId,
      date: {
        $gte: start,
        $lte: end,
      },
      status: {
        $in: ['pending', 'confirmed'],
      },
    }).select('time')

    const bookedTimes = new Set(bookedAppointments.map((appointment) => appointment.time))
    const slots = baseSlots.map((slot) => ({
      time: slot,
      isBooked: bookedTimes.has(slot),
    }))

    return res.status(200).json({
      day,
      availability,
      slots,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch availability',
    })
  }
}
