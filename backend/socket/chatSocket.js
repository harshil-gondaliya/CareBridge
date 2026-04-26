import jwt from 'jsonwebtoken'
import Chat from '../models/Chat.js'
import User from '../models/User.js'
import { getChatAppointmentForUser } from '../helpers/chatAccess.js'

const buildRoomId = (appointmentId) => `appointment:${appointmentId}`

const buildSocketMessage = (chat, clientTempId = '') => ({
  _id: chat._id,
  appointmentId: String(chat.appointmentId),
  senderId: String(chat.senderId._id || chat.senderId),
  receiverId: String(chat.receiverId),
  senderName: chat.senderId.name,
  message: chat.message,
  createdAt: chat.createdAt,
  clientTempId,
})

export const setupChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token || !process.env.JWT_SECRET) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId)

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.data.user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      }

      return next()
    } catch {
      return next(new Error('Invalid socket authentication'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join_room', async ({ appointmentId }, callback = () => {}) => {
      try {
        const access = await getChatAppointmentForUser(appointmentId, socket.data.user.id)

        if (access.error) {
          callback({
            ok: false,
            message: access.error,
          })
          return
        }

        const roomId = buildRoomId(appointmentId)
        socket.join(roomId)
        callback({
          ok: true,
          roomId,
        })
      } catch (error) {
        callback({
          ok: false,
          message: error.message || 'Unable to join chat room',
        })
      }
    })

    socket.on('send_message', async (payload, callback = () => {}) => {
      try {
        const appointmentId = payload?.appointmentId
        const message = typeof payload?.message === 'string' ? payload.message.trim() : ''
        const clientTempId = payload?.clientTempId || ''

        if (!appointmentId || !message) {
          callback({
            ok: false,
            message: 'Appointment and message are required',
          })
          return
        }

        const access = await getChatAppointmentForUser(appointmentId, socket.data.user.id)

        if (access.error) {
          callback({
            ok: false,
            message: access.error,
          })
          return
        }

        const savedChat = await Chat.create({
          appointmentId,
          senderId: socket.data.user.id,
          receiverId: access.receiver._id,
          message,
        })

        const populatedChat = await Chat.findById(savedChat._id).populate('senderId', 'name')
        const roomId = buildRoomId(appointmentId)
        const outgoingMessage = buildSocketMessage(populatedChat, clientTempId)

        io.to(roomId).emit('receive_message', outgoingMessage)
        callback({
          ok: true,
          message: outgoingMessage,
        })
      } catch (error) {
        callback({
          ok: false,
          message: error.message || 'Unable to send message',
        })
      }
    })
  })
}
