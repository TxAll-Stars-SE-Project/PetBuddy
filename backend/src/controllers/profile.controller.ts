import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { getUserProfile, updateUserProfile } from '../services/profile.service.js'
import { validateUpdateProfileInput } from '../validators/profile.validator.js'
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

/**
 * PUT /api/users/me — แก้ข้อมูลโปรไฟล์ของตัวเอง (US2-2)
 * คืน response หน้าตาเดียวกับ GET /api/users/me เพื่อให้ frontend เอาไปใช้ต่อได้เลย
 */
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const data = await validateUpdateProfileInput(req.body)
    const profile = await updateUserProfile(userId, data)

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
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error updating user profile:', error)
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERR',
      message: 'ระบบฐานข้อมูลขัดข้อง',
    })
  }
}
