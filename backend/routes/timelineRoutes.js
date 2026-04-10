import express from 'express'
import { getTimeline } from '../controllers/timelineController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, roleMiddleware('patient'), getTimeline)

export default router
