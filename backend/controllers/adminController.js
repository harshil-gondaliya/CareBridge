import User from '../models/User.js'

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })

    return res.status(200).json({
      count: users.length,
      users,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch users',
    })
  }
}

export const verifyDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)

    if (!doctor) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        message: 'Only doctor accounts can be verified',
      })
    }

    doctor.isVerified = true
    await doctor.save()

    return res.status(200).json({
      message: 'Doctor verified successfully',
      user: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        isVerified: doctor.isVerified,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to verify doctor',
    })
  }
}
