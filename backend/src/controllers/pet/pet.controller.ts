import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { validateCreatePetInput } from '../../validators/pet.validator.js'
import * as petService from '../../services/pet.service.js'
import { uploadPetImage } from '../../utils/supabase/index.js'
import { AppError } from '../../utils/errors.js'

export const createPetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.auth?.userId

    if (!ownerId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' })
      return
    }

    let imageUrl: string | null = req.body.image_url || req.body.photo || null

    // 1. Upload to Supabase Storage if an image file was provided
    if (req.file) {
      imageUrl = await uploadPetImage(req.file, ownerId)
    }

    // 2. Validate input fields
    const validatedData = validateCreatePetInput({
      ...req.body,
      image_url: imageUrl,
      photo: imageUrl,
    })

    // 3. Create pet record in database
    const pet = await petService.createPet(ownerId, validatedData)

    // 4. Return 201 Created with both standard API.md shape and success wrapper
    res.status(201).json({
      success: true,
      ...pet,
    })
  } catch (error: unknown) {
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
