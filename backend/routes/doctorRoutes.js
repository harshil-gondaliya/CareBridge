import express from 'express'
import {
  createOrUpdateDoctorProfile,
  getDoctorDashboard,
  getSingleDoctor,
  getVerifiedDoctors,
} from '../controllers/doctorController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.post(
  '/profile',
  authMiddleware,
  roleMiddleware('doctor'),
  createOrUpdateDoctorProfile,
)
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware('doctor'),
  getDoctorDashboard,
)
router.get('/', getVerifiedDoctors)
router.get('/:id', getSingleDoctor)

export default router
