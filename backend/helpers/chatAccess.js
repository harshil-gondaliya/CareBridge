import Appointment from '../models/Appointment.js'

const allowedChatStatuses = ['confirmed', 'completed']

export const canUseAppointmentChat = (status) => allowedChatStatuses.includes(status)

export const getChatAppointmentForUser = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'name email role')
    .populate('doctorId', 'name email role')

  if (!appointment) {
    return {
      error: 'Appointment not found',
      statusCode: 404,
    }
  }

  const isPatient = String(appointment.patientId?._id) === String(userId)
  const isDoctor = String(appointment.doctorId?._id) === String(userId)

  if (!isPatient && !isDoctor) {
    return {
      error: 'You do not have access to this appointment chat',
      statusCode: 403,
    }
  }

  if (!canUseAppointmentChat(appointment.status)) {
    return {
      error: 'Chat is only available after appointment confirmation',
      statusCode: 403,
    }
  }

  return {
    appointment,
    receiver: isPatient ? appointment.doctorId : appointment.patientId,
    role: isPatient ? 'patient' : 'doctor',
  }
}
