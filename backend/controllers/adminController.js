import DoctorProfile from '../models/DoctorProfile.js'
import User from '../models/User.js'

const buildDoctorPayload = (profile) => ({
  id: profile._id,
  userId: profile.userId?._id || profile.userId,
  name: profile.userId?.name,
  email: profile.userId?.email,
  specialization: profile.specialization,
  experience: profile.experience,
  qualification: profile.qualification,
  about: profile.about,
  profilePhoto: profile.profilePhoto,
  isVerified: profile.isVerified,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
})

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

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'name email role isVerified')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: doctors.length,
      doctors: doctors.map(buildDoctorPayload),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch doctors',
    })
  }
}

export const verifyDoctor = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findById(req.params.id).populate(
      'userId',
      'name email role',
    )

    if (!doctorProfile) {
      return res.status(404).json({
        message: 'Doctor profile not found',
      })
    }

    doctorProfile.isVerified = true
    await doctorProfile.save()

    await User.findByIdAndUpdate(doctorProfile.userId._id, { isVerified: true })

    return res.status(200).json({
      message: 'Doctor verified successfully',
      doctor: buildDoctorPayload(doctorProfile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to verify doctor',
    })
  }
}

export const blockDoctor = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findById(req.params.id).populate(
      'userId',
      'name email role',
    )

    if (!doctorProfile) {
      return res.status(404).json({
        message: 'Doctor profile not found',
      })
    }

    doctorProfile.isVerified = false
    await doctorProfile.save()

    await User.findByIdAndUpdate(doctorProfile.userId._id, { isVerified: false })

    return res.status(200).json({
      message: 'Doctor blocked successfully',
      doctor: buildDoctorPayload(doctorProfile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to block doctor',
    })
  }
}
