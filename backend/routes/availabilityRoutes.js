import express from 'express'
import {
  getDoctorAvailability,
  setAvailability,
} from '../controllers/availabilityController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware('doctor'), setAvailability)
router.get('/:doctorId', getDoctorAvailability)

export default router
