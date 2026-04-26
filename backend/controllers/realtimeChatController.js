import Chat from '../models/Chat.js'
import { getChatAppointmentForUser } from '../helpers/chatAccess.js'

const mapChatMessage = (chat, currentUserId) => ({
  _id: chat._id,
  appointmentId: chat.appointmentId,
  senderId: chat.senderId?._id || chat.senderId,
  receiverId: chat.receiverId?._id || chat.receiverId,
  message: chat.message,
  createdAt: chat.createdAt,
  senderName: chat.senderId?.name || '',
  isOwnMessage: String(chat.senderId?._id || chat.senderId) === String(currentUserId),
})

export const getAppointmentMessages = async (req, res) => {
  try {
    const access = await getChatAppointmentForUser(req.params.appointmentId, req.user._id)

    if (access.error) {
      return res.status(access.statusCode).json({
        message: access.error,
      })
    }

    const messages = await Chat.find({ appointmentId: req.params.appointmentId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 })

    return res.status(200).json({
      appointment: {
        _id: access.appointment._id,
        status: access.appointment.status,
        date: access.appointment.date,
        time: access.appointment.time,
        patient: access.appointment.patientId,
        doctor: access.appointment.doctorId,
      },
      messages: messages.map((chat) => mapChatMessage(chat, req.user._id)),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to load chat messages',
    })
  }
}
