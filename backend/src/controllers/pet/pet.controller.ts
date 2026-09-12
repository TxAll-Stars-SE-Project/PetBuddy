import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { validateCreatePetInput, validateUpdatePetInput } from '../../validators/pet.validator.js'
import * as petService from '../../services/pet.service.js'
import { uploadPetImage, deletePetImage } from '../../utils/supabase/index.js'
import { AppError } from '../../utils/errors.js'

export const createPetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  let uploadedImageUrl: string | null = null

  try {
    const ownerId = req.auth?.userId

    if (!ownerId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' })
      return
    }

    // 1. Validate input fields FIRST before uploading to prevent orphaned files on invalid input
    const rawImageUrl = req.body.image_url || req.body.photo || null
    const validatedData = validateCreatePetInput({
      ...req.body,
      image_url: rawImageUrl,
      photo: rawImageUrl,
    })

    // 2. Upload to Supabase Storage only after input validation succeeds
    if (req.file) {
      uploadedImageUrl = await uploadPetImage(req.file, ownerId)
      validatedData.image_url = uploadedImageUrl
      validatedData.photo = uploadedImageUrl
    }

    // 3. Create pet record in database
    const pet = await petService.createPet(ownerId, validatedData)

    // 4. Return 201 Created with both standard API.md shape and success wrapper
    res.status(201).json({
      success: true,
      ...pet,
    })
  } catch (error: unknown) {
    // Rollback: if an image was uploaded but database creation failed, delete it from storage
    if (uploadedImageUrl) {
      await deletePetImage(uploadedImageUrl).catch((err) =>
        console.error('Failed to rollback uploaded image from storage:', err)
      )
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error creating pet:', error)
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create pet profile',
      detail: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export const updatePetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  let uploadedImageUrl: string | null = null

  try {
    const ownerId = req.auth?.userId

    if (!ownerId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' })
      return
    }

    const petId = Number(req.params.id)
    if (!Number.isInteger(petId) || petId <= 0) {
      res.status(400).json({
        error: 'INVALID_PET_ID',
        message: 'รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก',
      })
      return
    }

    // 1. Validate fields FIRST before uploading new image to prevent orphaned files
    const rawImageUrl = req.body.image_url || req.body.photo || undefined
    const validatedData = validateUpdatePetInput({
      ...req.body,
      image_url: rawImageUrl,
      photo: rawImageUrl,
    })

    // 2. Upload new image to Supabase Storage only after validation succeeds
    if (req.file) {
      uploadedImageUrl = await uploadPetImage(req.file, ownerId)
      validatedData.image_url = uploadedImageUrl
      validatedData.photo = uploadedImageUrl
    }

    // 3. Update pet record in database (and deletes old image if new image is updated)
    const pet = await petService.updatePet(petId, ownerId, validatedData)

    // 4. Return 200 OK with updated pet
    res.status(200).json({
      success: true,
      ...pet,
    })
  } catch (error: unknown) {
    // Rollback: if a new image was uploaded but DB update failed, delete the newly uploaded image
    if (uploadedImageUrl) {
      await deletePetImage(uploadedImageUrl).catch((err) =>
        console.error('Failed to rollback uploaded image from storage:', err)
      )
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error updating pet:', error)
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update pet profile',
      detail: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

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

