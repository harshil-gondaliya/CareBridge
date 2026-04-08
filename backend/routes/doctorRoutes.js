import express from 'express'
import { getDoctorDashboard } from '../controllers/doctorController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware('doctor'),
  getDoctorDashboard,
)

export default router
