import cors from 'cors'
import compression from 'compression'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'node:http'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from './config/db.js'
import './config/cloudinary.js'
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
const server = createServer(app)
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL
const allowedOrigins = ['http://localhost:5173', clientUrl].filter(Boolean)

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
})

app.disable('x-powered-by')
app.use(helmet())
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', apiLimiter)
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

const logCloudinaryReady = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  ) {
    console.log('✅ Cloudinary Ready')
  } else {
    console.warn('⚠️ Cloudinary environment variables are not fully configured')
  }
}

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
  console.error('Global error handler:', error)
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

const startServer = async () => {
  try {
    await connectDB()
    logCloudinaryReady()
    console.log('✅ Socket.IO Ready')

    server.listen(process.env.PORT || 5000, () => {
      console.log('🚀 CareBridge Backend Running')
      console.log(`Listening on port ${process.env.PORT || 5000}`)
    })
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`)
    process.exit(1)
  }
}

startServer()
