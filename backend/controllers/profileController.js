import DoctorProfile from '../models/DoctorProfile.js'
import PatientProfile from '../models/PatientProfile.js'
import cloudinary from '../config/cloudinary.js'
import User from '../models/User.js'

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization,
  experience: user.experience,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const buildPatientProfilePayload = (profile) => ({
  id: profile._id,
  userId: profile.userId?._id || profile.userId,
  age: profile.age,
  gender: profile.gender,
  mobile: profile.mobile,
  bloodGroup: profile.bloodGroup,
  diseases: profile.diseases,
  profilePhoto: profile.profilePhoto,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
})

const buildDoctorProfilePayload = (profile) => ({
  id: profile._id,
  userId: profile.userId?._id || profile.userId,
  specialization: profile.specialization,
  experience: profile.experience,
  qualification: profile.qualification,
  about: profile.about,
  profilePhoto: profile.profilePhoto,
  isVerified: profile.isVerified,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
})

const ensureCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME
    || !process.env.CLOUDINARY_API_KEY
    || !process.env.CLOUDINARY_API_SECRET
  ) {
    const error = new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the backend .env file.')
    error.statusCode = 500
    throw error
  }
}

const uploadProfilePhoto = async (file, folder) => {
  if (!file) {
    return null
  }

  ensureCloudinaryConfig()

  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: 'image',
  })

  return result.secure_url
}

export const getMyProfile = async (req, res) => {
  try {
    let profile = null

    if (req.user.role === 'patient') {
      const patientProfile = await PatientProfile.findOne({ userId: req.user._id }).populate(
        'userId',
        'name email role specialization experience isVerified createdAt updatedAt',
      )

      profile = patientProfile ? buildPatientProfilePayload(patientProfile) : null
    }

    if (req.user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id }).populate(
        'userId',
        'name email role specialization experience isVerified createdAt updatedAt',
      )

      profile = doctorProfile ? buildDoctorProfilePayload(doctorProfile) : null
    }

    return res.status(200).json({
      user: buildUserPayload(req.user),
      profile,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch profile',
    })
  }
}

export const updatePatientProfile = async (req, res) => {
  try {
    const {
      age,
      gender = '',
      mobile = '',
      bloodGroup = '',
      diseases = '',
    } = req.body

    if (age !== undefined && age !== '' && (Number.isNaN(Number(age)) || Number(age) < 0)) {
      return res.status(400).json({
        message: 'Age must be a valid non-negative number',
      })
    }

    const uploadedProfilePhoto = await uploadProfilePhoto(
      req.file,
      'carebridge/patient-profiles',
    )

    const existingProfile = await PatientProfile.findOne({ userId: req.user._id })

    const patientProfile = await PatientProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        age: age === '' || age === undefined ? null : Number(age),
        gender: gender.trim(),
        mobile: mobile.trim(),
        bloodGroup: bloodGroup.trim(),
        diseases: diseases.trim(),
        profilePhoto: uploadedProfilePhoto || existingProfile?.profilePhoto || '',
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    const updatedUser = await User.findById(req.user._id)

    return res.status(200).json({
      message: 'Patient profile updated successfully',
      user: buildUserPayload(updatedUser),
      profile: buildPatientProfilePayload(patientProfile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: error.message || 'Failed to update patient profile',
    })
  }
}

export const updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualification = '',
      about = '',
    } = req.body

    if (!specialization?.trim() || experience === undefined || experience === '') {
      return res.status(400).json({
        message: 'Specialization and experience are required',
      })
    }

    if (Number.isNaN(Number(experience)) || Number(experience) < 0) {
      return res.status(400).json({
        message: 'Experience must be a valid non-negative number',
      })
    }

    const uploadedProfilePhoto = await uploadProfilePhoto(
      req.file,
      'carebridge/doctor-profiles',
    )

    const existingProfile = await DoctorProfile.findOne({ userId: req.user._id })

    const doctorProfile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        specialization: specialization.trim(),
        experience: Number(experience),
        qualification: qualification.trim(),
        about: about.trim(),
        profilePhoto: uploadedProfilePhoto || existingProfile?.profilePhoto || '',
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    await User.findByIdAndUpdate(req.user._id, {
      specialization: doctorProfile.specialization,
      experience: doctorProfile.experience,
    })

    const updatedUser = await User.findById(req.user._id)

    return res.status(200).json({
      message: 'Doctor profile updated successfully',
      user: buildUserPayload(updatedUser),
      profile: buildDoctorProfilePayload(doctorProfile),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: error.message || 'Failed to update doctor profile',
    })
  }
}
