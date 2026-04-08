import express from 'express'
import {
  getAllUsers,
  verifyDoctor,
} from '../controllers/adminController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/users', authMiddleware, roleMiddleware('admin'), getAllUsers)
router.put(
  '/verify-doctor/:id',
  authMiddleware,
  roleMiddleware('admin'),
  verifyDoctor,
)

export default router
