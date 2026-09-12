import multer from 'multer'
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'

const storage = multer.memoryStorage()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only image files (JPEG, PNG, WebP, GIF) are allowed'))
      return
    }
    cb(null, true)
  },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
])

/**
 * Middleware that parses multipart/form-data with an optional pet photo/image.
 * If a file is uploaded under 'photo', 'image', or 'file', it attaches it to `req.file`.
 * If no multipart form-data is sent, passes through safely.
 */
export const uploadPetImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentType = req.headers['content-type'] || ''
  if (!contentType.includes('multipart/form-data')) {
    // Normal JSON or urlencoded request
    next()
    return
  }

  upload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            error: 'FILE_TOO_LARGE',
            message: 'Uploaded file size exceeds the 5MB limit',
          })
          return
        }
        res.status(400).json({
          error: 'UPLOAD_ERROR',
          message: err.message,
        })
        return
      }

      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: err.errorCode,
          message: err.message,
        })
        return
      }

      res.status(400).json({
        error: 'UPLOAD_ERROR',
        message: err instanceof Error ? err.message : 'File upload failed',
      })
      return
    }

    // Attach matched single file to req.file if uploaded
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    if (files) {
      const matched = files.photo?.[0] || files.image?.[0] || files.file?.[0]
      if (matched) {
        req.file = matched
      }
    }

    next()
  })
}
