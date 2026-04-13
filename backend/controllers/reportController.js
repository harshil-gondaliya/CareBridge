import cloudinary from '../config/cloudinary.js'
import Report from '../models/Report.js'
import { parsePrescriptionText } from '../helpers/prescriptionTextParser.js'

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

const ensureOcrConfig = () => {
  if (!process.env.OCR_SERVICE_URL) {
    const error = new Error('OCR_SERVICE_URL is not configured in the backend .env file.')
    error.statusCode = 500
    throw error
  }
}

const uploadReportImage = async (file) => {
  ensureCloudinaryConfig()

  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'carebridge/prescription-reports',
    resource_type: 'image',
  })

  return result.secure_url
}

const runOcr = async (file) => {
  ensureOcrConfig()

  const formData = new FormData()
  const blob = new Blob([file.buffer], { type: file.mimetype })
  formData.append('image', blob, file.originalname)

  let response

  try {
    response = await fetch(process.env.OCR_SERVICE_URL, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    const connectionError = new Error(
      `OCR service is unreachable at ${process.env.OCR_SERVICE_URL}. Start the EasyOCR server and try again.`,
    )
    connectionError.statusCode = 503
    throw connectionError
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error || payload?.message || 'OCR processing failed'
    const error = new Error(message)
    error.statusCode = response.status || 502
    throw error
  }

  return payload
}

const buildScanQuality = (ocrPayload = {}) => ({
  averageConfidence: Number(ocrPayload.averageConfidence || 0),
  bodyAverageConfidence: Number(ocrPayload.bodyAverageConfidence || 0),
  bodyVariant: ocrPayload.bodyVariant || '',
  linesDetected: Number(ocrPayload.linesDetected || 0),
  bodyLinesDetected: Number(ocrPayload.bodyLinesDetected || 0),
})

export const createReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Prescription image is required',
      })
    }

    const [imageUrl, ocrPayload] = await Promise.all([
      uploadReportImage(req.file),
      runOcr(req.file),
    ])

    const parsed = parsePrescriptionText(ocrPayload)

    const report = await Report.create({
      patientId: req.user._id,
      imageUrl,
      extractedText: parsed.extractedText,
      medicines: parsed.medicines,
      notes: parsed.notes,
      reviewFlags: parsed.reviewFlags,
      safetySummary: parsed.safetySummary,
      scanQuality: buildScanQuality(ocrPayload),
      ocrPayload,
      isVerified: false,
    })

    const populatedReport = await Report.findById(report._id)
      .populate('patientId', 'name email')

    return res.status(201).json({
      message: 'Prescription scanned successfully. Please review and verify extracted text.',
      report: populatedReport,
      ocr: ocrPayload,
    })
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to process prescription image',
    })
  }
}

export const verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const { extractedText } = req.body

    if (!extractedText || typeof extractedText !== 'string' || !extractedText.trim()) {
      return res.status(400).json({
        message: 'Editable extracted text is required for verification.',
      })
    }

    const report = await Report.findOne({
      _id: reportId,
      patientId: req.user._id,
    })

    if (!report) {
      return res.status(404).json({
        message: 'Prescription report not found.',
      })
    }

    const parsed = parsePrescriptionText({
      ...(report.ocrPayload || {}),
      correctedPrescriptionText: extractedText,
    })

    report.extractedText = extractedText.trim()
    report.medicines = parsed.medicines
    report.notes = parsed.notes
    report.reviewFlags = parsed.reviewFlags
    report.safetySummary = parsed.safetySummary
    report.isVerified = true
    report.verifiedAt = new Date()

    await report.save()

    const populatedReport = await Report.findById(report._id)
      .populate('patientId', 'name email')

    return res.status(200).json({
      message: 'Prescription verified. Final output generated successfully.',
      report: populatedReport,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to verify prescription report.',
    })
  }
}

export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: reports.length,
      reports,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Failed to fetch prescription reports',
    })
  }
}
