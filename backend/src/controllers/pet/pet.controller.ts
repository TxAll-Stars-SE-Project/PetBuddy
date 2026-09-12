import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { validateCreatePetInput } from '../../validators/pet.validator.js'
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
