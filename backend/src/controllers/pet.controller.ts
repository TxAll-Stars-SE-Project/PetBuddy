import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import * as petService from '../services/pet.service.js'
import { AppError } from '../utils/errors.js'

export const deletePet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.auth?.userId

    if (!ownerId) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'ไม่ได้ส่ง Token ใน Header',
      })
      return
    }

    // ค่าที่มากับ URL เป็น string เสมอ ต้องแปลงเป็นตัวเลขก่อนส่งให้ Prisma
    const petId = Number(req.params.id)

    if (!Number.isInteger(petId) || petId <= 0) {
      res.status(400).json({
        success: false,
        error: 'INVALID_PET_ID',
        message: 'รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก',
      })
      return
    }

    await petService.deletePet(petId, ownerId)

    // 204 = สำเร็จแต่ไม่มีเนื้อหาส่งกลับ
    res.status(204).send()
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.errorCode,
        message: error.message,
      })
      return
    }

    console.error('Error deleting pet:', error)
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERR',
      message: 'ระบบฐานข้อมูลขัดข้อง',
    })
  }
}
