import { getSupabaseClient, SUPABASE_STORAGE_BUCKET, PAY_QR_STORAGE_BUCKET } from './client.js'
import { AppError } from '../errors.js'

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * Shared internal helper to upload an image into a specified Supabase bucket and folder.
 */
const uploadToBucket = async (
  bucket: string,
  folder: string,
  ownerOrSitterId: number,
  file: Express.Multer.File,
  defaultExt: string
): Promise<string> => {
  const supabase = getSupabaseClient()
  const fileExt = MIME_EXTENSION_MAP[file.mimetype] || defaultExt
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const filePath = `${folder}/${ownerOrSitterId}/${Date.now()}-${randomSuffix}.${fileExt}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) {
    console.error(`Supabase storage upload error (${bucket}):`, error)
    throw new AppError(
      500,
      'STORAGE_UPLOAD_ERROR',
      `Failed to upload image to Supabase: ${error.message}`
    )
  }

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
}

/**
 * Shared internal helper to extract relative object path from a public URL or relative path.
 */
const extractBucketPath = (
  bucket: string,
  folder: string,
  imageUrlOrPath: string
): string | null => {
  if (!imageUrlOrPath) return null
  const bucketMarker = `/storage/v1/object/public/${bucket}/`
  if (imageUrlOrPath.includes(bucketMarker)) {
    return imageUrlOrPath.split(bucketMarker)[1] || null
  }
  return imageUrlOrPath.startsWith(`${folder}/`) ? imageUrlOrPath : null
}

/**
 * Shared internal helper to delete an object from a Supabase bucket.
 */
const deleteFromBucket = async (
  bucket: string,
  folder: string,
  imageUrlOrPath: string
): Promise<void> => {
  const filePath = extractBucketPath(bucket, folder, imageUrlOrPath)
  if (!filePath) return

  try {
    const { error } = await getSupabaseClient().storage.from(bucket).remove([filePath])
    if (error) {
      console.warn(`[Supabase Storage] Failed to delete image at ${filePath}:`, error.message)
    }
  } catch (err) {
    console.warn(`[Supabase Storage] Error deleting image at ${filePath}:`, err)
  }
}

/**
 * Pet profile image storage helpers (Bucket: petbuddy-images, Folder: pets)
 */
export const uploadPetImage = (file: Express.Multer.File, ownerId: number): Promise<string> =>
  uploadToBucket(SUPABASE_STORAGE_BUCKET, 'pets', ownerId, file, 'jpg')

export const extractStoragePath = (imageUrlOrPath: string): string | null =>
  extractBucketPath(SUPABASE_STORAGE_BUCKET, 'pets', imageUrlOrPath)

export const deletePetImage = (imageUrlOrPath: string): Promise<void> =>
  deleteFromBucket(SUPABASE_STORAGE_BUCKET, 'pets', imageUrlOrPath)

/**
 * Sitter QR code storage helpers (Bucket: Pay_Qr, Folder: qrcodes)
 */
export const uploadQrCodeImage = (file: Express.Multer.File, sitterId: number): Promise<string> =>
  uploadToBucket(PAY_QR_STORAGE_BUCKET, 'qrcodes', sitterId, file, 'png')

export const extractQrStoragePath = (imageUrlOrPath: string): string | null =>
  extractBucketPath(PAY_QR_STORAGE_BUCKET, 'qrcodes', imageUrlOrPath)

export const deleteQrCodeImage = (imageUrlOrPath: string): Promise<void> =>
  deleteFromBucket(PAY_QR_STORAGE_BUCKET, 'qrcodes', imageUrlOrPath)
