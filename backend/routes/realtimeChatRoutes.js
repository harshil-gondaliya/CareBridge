import express from 'express'
import { getAppointmentMessages } from '../controllers/realtimeChatController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/appointments/:appointmentId/messages', authMiddleware, roleMiddleware('patient', 'doctor'), getAppointmentMessages)

export default router
