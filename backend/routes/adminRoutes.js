import express from 'express'
import {
  blockDoctor,
  getAllDoctors,
  getAllUsers,
  verifyDoctor,
} from '../controllers/adminController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/users', authMiddleware, roleMiddleware('admin'), getAllUsers)
router.get('/doctors', authMiddleware, roleMiddleware('admin'), getAllDoctors)
router.put(
  '/verify-doctor/:id',
  authMiddleware,
  roleMiddleware('admin'),
  verifyDoctor,
)
router.put(
  '/block-doctor/:id',
  authMiddleware,
  roleMiddleware('admin'),
  blockDoctor,
)

export default router
