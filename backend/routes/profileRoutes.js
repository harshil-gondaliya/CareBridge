import express from 'express'
import {
  getMyProfile,
  updateDoctorProfile,
  updatePatientProfile,
} from '../controllers/profileController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'
import { singleProfilePhoto } from '../middleware/upload.js'

const router = express.Router()

router.get('/me', authMiddleware, getMyProfile)
router.put('/patient', authMiddleware, roleMiddleware('patient'), singleProfilePhoto, updatePatientProfile)
router.put('/doctor', authMiddleware, roleMiddleware('doctor'), singleProfilePhoto, updateDoctorProfile)

export default router
