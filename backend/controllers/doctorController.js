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

export const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualification = '',
      about = '',
      profilePhoto = '',
    } = req.body

    if (!specialization?.trim() || experience === undefined) {
      return res.status(400).json({
        message: 'Specialization and experience are required',
      })
    }

    if (Number.isNaN(Number(experience)) || Number(experience) < 0) {
      return res.status(400).json({
        message: 'Experience must be a valid non-negative number',
      })
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        specialization: specialization.trim(),
        experience: Number(experience),
        qualification: qualification.trim(),
        about: about.trim(),
        profilePhoto: profilePhoto.trim(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate('userId', 'name email role')

    await User.findByIdAndUpdate(req.user._id, {
      specialization: profile.specialization,
      experience: profile.experience,
    })

    return res.status(200).json({
      message: 'Doctor profile saved successfully',
      profile: buildDoctorPayload(profile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to save doctor profile',
    })
  }
}

export const getDoctorDashboard = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role',
    )

    return res.status(200).json({
      message: 'Doctor dashboard data fetched successfully',
      dashboard: {
        doctorId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        specialization: req.user.specialization,
        experience: req.user.experience,
        isVerified: req.user.isVerified,
        profile: profile ? buildDoctorPayload(profile) : null,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch doctor dashboard',
    })
  }
}

export const getVerifiedDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ isVerified: true })
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })

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

export const getSingleDoctor = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      _id: req.params.id,
      isVerified: true,
    }).populate(
      'userId',
      'name email role',
    )

    if (!profile) {
      return res.status(404).json({
        message: 'Verified doctor profile not found',
      })
    }

    return res.status(200).json({
      doctor: buildDoctorPayload(profile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch doctor profile',
    })
  }
}
