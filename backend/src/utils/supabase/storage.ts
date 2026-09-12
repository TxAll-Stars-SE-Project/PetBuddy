import { getSupabaseClient, SUPABASE_STORAGE_BUCKET } from './client.js'
import { AppError } from '../errors.js'

/**
 * Uploads a pet profile image to Supabase Storage and returns its public URL.
 */
export const uploadPetImage = async (
  file: Express.Multer.File,
  ownerId: number
): Promise<string> => {
  const supabase = getSupabaseClient()

  const originalExt = file.originalname.includes('.')
    ? file.originalname.split('.').pop()?.toLowerCase()
    : 'jpg'
  const fileExt = originalExt || 'jpg'
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const fileName = `${Date.now()}-${randomSuffix}.${fileExt}`
  const filePath = `pets/${ownerId}/${fileName}`

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    throw new AppError(
      500,
      'STORAGE_UPLOAD_ERROR',
      `Failed to upload image to Supabase: ${error.message}`
    )
  }

  const { data } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}
