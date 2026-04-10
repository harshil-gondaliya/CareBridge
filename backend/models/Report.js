import mongoose from 'mongoose'

const reportMedicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    dosage: {
      type: String,
      trim: true,
      default: '',
    },
    frequency: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  },
)

const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      trim: true,
      default: '',
    },
    medicines: {
      type: [reportMedicineSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

const Report = mongoose.model('Report', reportSchema)

export default Report
