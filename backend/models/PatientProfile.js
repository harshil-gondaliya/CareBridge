import mongoose from 'mongoose'

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: '',
    },
    diseases: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema)

export default PatientProfile
