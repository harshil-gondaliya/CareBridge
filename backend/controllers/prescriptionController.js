import Appointment from '../models/Appointment.js'
import Prescription from '../models/Prescription.js'

const sanitizeMedicines = (medicines = []) => (
  medicines
    .map((medicine) => ({
      name: medicine?.name?.trim() || '',
      dosage: medicine?.dosage?.trim() || '',
      frequency: medicine?.frequency?.trim() || '',
      duration: medicine?.duration?.trim() || '',
    }))
    .filter((medicine) => (
      medicine.name
      || medicine.dosage
      || medicine.frequency
      || medicine.duration
    ))
)

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines = [], notes = '' } = req.body

    if (!appointmentId) {
      return res.status(400).json({
        message: 'Appointment ID is required',
      })
    }

    const cleanedMedicines = sanitizeMedicines(medicines)

    if (!cleanedMedicines.length) {
      return res.status(400).json({
        message: 'At least one medicine is required',
      })
    }

    const hasIncompleteMedicine = cleanedMedicines.some((medicine) => (
      !medicine.name
      || !medicine.dosage
      || !medicine.frequency
      || !medicine.duration
    ))

    if (hasIncompleteMedicine) {
      return res.status(400).json({
        message: 'Each medicine must include name, dosage, frequency, and duration',
      })
    }

    const appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      })
    }

    if (String(appointment.doctorId) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only create prescriptions for your own appointments',
      })
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        message: 'Prescription can only be created for completed appointments',
      })
    }

    const existingPrescription = await Prescription.findOne({ appointmentId })

    if (existingPrescription) {
      return res.status(409).json({
        message: 'A prescription already exists for this appointment',
      })
    }

    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      medicines: cleanedMedicines,
      notes: notes.trim(),
    })

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctorId', 'name email specialization')
      .populate('patientId', 'name email')
      .populate('appointmentId', 'date time status')

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription: populatedPrescription,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to create prescription',
    })
  }
}

export const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate('doctorId', 'name email specialization')
      .populate('appointmentId', 'date time status')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch prescriptions',
    })
  }
}
