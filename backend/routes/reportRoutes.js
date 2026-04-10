import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'
import { createReport, getMyReports, verifyReport } from '../controllers/reportController.js'
import { singleReportImage } from '../middleware/upload.js'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware('patient'), singleReportImage, createReport)
router.put('/:reportId/verify', authMiddleware, roleMiddleware('patient'), verifyReport)
router.get('/my', authMiddleware, roleMiddleware('patient'), getMyReports)

export default router
