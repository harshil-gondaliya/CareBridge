import express from 'express'
import {
  bookAppointment,
  getDoctorAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware('patient'), bookAppointment)
router.get('/my', authMiddleware, roleMiddleware('patient'), getMyAppointments)
router.get('/doctor', authMiddleware, roleMiddleware('doctor'), getDoctorAppointments)
router.put('/:id/status', authMiddleware, roleMiddleware('doctor'), updateAppointmentStatus)

export default router
