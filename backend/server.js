import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from './config/db.js'
import adminRoutes from './routes/adminRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import availabilityRoutes from './routes/availabilityRoutes.js'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import realtimeChatRoutes from './routes/realtimeChatRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import { setupChatSocket } from './socket/chatSocket.js'
import timelineRoutes from './routes/timelineRoutes.js'
import userRoutes from './routes/userRoutes.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
setupChatSocket(io)

app.get('/', (req, res) => {
  res.json({
    message: 'CareBridge API is running',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CareBridge backend',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/chat', realtimeChatRoutes)
app.use('/api/user', userRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/timeline', timelineRoutes)

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  })
})

const startServer = async () => {
  try {
    await connectDB()

    httpServer.listen(PORT, () => {
      console.log(`CareBridge backend running on port ${PORT}`)
    })
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`)
    process.exit(1)
  }
}

startServer()
