import multer from 'multer'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'))
    return
  }

  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
    cb(new Error('Only JPG and PNG images are allowed'))
    return
  }

  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
})

export const singleProfilePhoto = (req, res, next) => {
  upload.single('profilePhoto')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        message: 'Profile photo must be 2MB or smaller',
      })
      return
    }

    res.status(400).json({
      message: error.message || 'Failed to upload profile photo',
    })
  })
}

export const singleReportImage = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        message: 'Prescription image must be 2MB or smaller',
      })
      return
    }

    res.status(400).json({
      message: error.message || 'Failed to upload prescription image',
    })
  })
}

export const singleChatImage = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        message: 'Chat image must be 2MB or smaller',
      })
      return
    }

    res.status(400).json({
      message: error.message || 'Failed to upload chat image',
    })
  })
}
