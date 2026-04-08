import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  )
}

const buildAuthResponse = (user) => ({
  token: createToken(user),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
})

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const validateCommonRegistrationFields = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return 'Name, email, and password are required'
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }

  return null
}

const handleRegistrationError = (res, error, fallbackMessage) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Email is already registered',
    })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(', '),
    })
  }

  console.error(error)
  return res.status(500).json({
    message: fallbackMessage,
  })
}

export const registerPatient = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const validationError = validateCommonRegistrationFields({
      name,
      email,
      password,
    })

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'patient',
    })

    return res.status(201).json({
      message: 'Patient registered successfully',
      user: buildUserResponse(user),
    })
  } catch (error) {
    return handleRegistrationError(res, error, 'Patient registration failed')
  }
}

export const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      licenseNumber,
    } = req.body

    const validationError = validateCommonRegistrationFields({
      name,
      email,
      password,
    })

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    if (!specialization || experience === undefined || !licenseNumber) {
      return res.status(400).json({
        message: 'Specialization, experience, and license number are required',
      })
    }

    if (Number.isNaN(Number(experience)) || Number(experience) < 0) {
      return res.status(400).json({
        message: 'Experience must be a valid non-negative number',
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
      specialization,
      experience: Number(experience),
      licenseNumber,
      isVerified: false,
    })

    return res.status(201).json({
      message: 'Doctor registered successfully and is pending verification',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        licenseNumber: user.licenseNumber,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    return handleRegistrationError(res, error, 'Doctor registration failed')
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    return res.status(200).json(buildAuthResponse(user))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Login failed',
    })
  }
}
