import Appointment from '../models/Appointment.js'
import Prescription from '../models/Prescription.js'
import Report from '../models/Report.js'

export const getTimeline = async (req, res) => {
  try {
    const patientId = req.user._id

    const [appointments, prescriptions, reports] = await Promise.all([
      Appointment.find({ patientId })
        .populate('doctorId', 'name email specialization')
        .sort({ createdAt: -1 })
        .lean(),
      Prescription.find({ patientId })
        .populate('doctorId', 'name email specialization')
        .populate('appointmentId', 'date time status')
        .sort({ createdAt: -1 })
        .lean(),
      Report.find({ patientId })
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const timeline = [
      ...appointments.map((item) => ({
        type: 'appointment',
        data: item,
        createdAt: item.createdAt,
      })),
      ...prescriptions.map((item) => ({
        type: 'prescription',
        data: item,
        createdAt: item.createdAt,
      })),
      ...reports.map((item) => ({
        type: 'report',
        data: item,
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return res.status(200).json({
      count: timeline.length,
      timeline,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch medical timeline',
    })
  }
}
