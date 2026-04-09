import mongoose from 'mongoose'

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    slotDuration: {
      type: Number,
      default: 30,
      min: 15,
    },
  },
  {
    timestamps: true,
  },
)

availabilitySchema.index({ doctorId: 1, day: 1 }, { unique: true })

const Availability = mongoose.model('Availability', availabilitySchema)

export default Availability
