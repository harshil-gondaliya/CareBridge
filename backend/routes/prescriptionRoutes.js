import express from 'express'
import {
  createPrescription,
  getMyPrescriptions,
} from '../controllers/prescriptionController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware('doctor'), createPrescription)
router.get('/my', authMiddleware, roleMiddleware('patient'), getMyPrescriptions)

export default router
