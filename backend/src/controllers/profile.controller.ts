import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { getUserProfile } from '../services/profile.service.js'
import { AppError } from '../utils/errors.js'

export const getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'ไม่ได้ส่ง Token ใน Header',
      })
      return
    }

    const profile = await getUserProfile(userId)

    res.status(200).json({
      success: true,
      data: profile,
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.errorCode,
        message: error.message,
      })
      return
    }

    console.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERR',
      message: 'ระบบฐานข้อมูลขัดข้อง',
    })
  }
}
