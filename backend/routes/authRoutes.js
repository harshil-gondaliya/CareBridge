import express from 'express'
import {
  login,
  registerDoctor,
  registerPatient,
} from '../controllers/authController.js'

const router = express.Router()

router.post('/register/patient', registerPatient)
router.post('/register/doctor', registerDoctor)
router.post('/login', login)

export default router
