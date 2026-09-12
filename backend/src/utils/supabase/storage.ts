import { getSupabaseClient, SUPABASE_STORAGE_BUCKET } from './client.js'
import { AppError } from '../errors.js'

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * Uploads a pet profile image to Supabase Storage and returns its public URL.
 */
export const uploadPetImage = async (
  file: Express.Multer.File,
  ownerId: number
): Promise<string> => {
  const supabase = getSupabaseClient()

  const fileExt = MIME_EXTENSION_MAP[file.mimetype] || 'jpg'
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

/**
 * Extracts the storage object path from a Supabase public URL or relative path.
 * E.g. https://.../storage/v1/object/public/petbuddy-images/pets/105/1789205988041-3fouapx.jpg -> pets/105/1789205988041-3fouapx.jpg
 */
export const extractStoragePath = (imageUrlOrPath: string): string | null => {
  if (!imageUrlOrPath) return null
  const bucketMarker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`
  if (imageUrlOrPath.includes(bucketMarker)) {
    const parts = imageUrlOrPath.split(bucketMarker)
    return parts[1] || null
  }
  if (imageUrlOrPath.startsWith('pets/')) {
    return imageUrlOrPath
  }
  return null
}

/**
 * Deletes a pet image from Supabase Storage given its public URL or storage path.
 * Designed to be reusable across pet deletion, image updates/edits, and creation rollbacks.
 */
export const deletePetImage = async (imageUrlOrPath: string): Promise<void> => {
  if (!imageUrlOrPath) return

  const filePath = extractStoragePath(imageUrlOrPath)
  if (!filePath) return

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      console.warn(`[Supabase Storage] Failed to delete image at ${filePath}:`, error.message)
    }
  } catch (err) {
    console.warn(`[Supabase Storage] Error deleting image at ${filePath}:`, err)
  }
}