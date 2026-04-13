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
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    sourceText: {
      type: String,
      trim: true,
      default: '',
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    reviewReasons: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
)

const scanQualitySchema = new mongoose.Schema(
  {
    averageConfidence: {
      type: Number,
      default: 0,
    },
    bodyAverageConfidence: {
      type: Number,
      default: 0,
    },
    bodyVariant: {
      type: String,
      trim: true,
      default: '',
    },
    linesDetected: {
      type: Number,
      default: 0,
    },
    bodyLinesDetected: {
      type: Number,
      default: 0,
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
    reviewFlags: {
      type: [String],
      default: [],
    },
    safetySummary: {
      type: [String],
      default: [],
    },
    scanQuality: {
      type: scanQualitySchema,
      default: () => ({}),
    },
    ocrPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
