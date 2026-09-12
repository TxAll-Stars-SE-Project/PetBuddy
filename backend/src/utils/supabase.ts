import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppError } from './errors.js'

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://azprqudssagsgjqupvzt.supabase.co'

export const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'petbuddy-images'

let clientInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (clientInstance) return clientInstance

  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!key) {
    throw new AppError(
      500,
      'SUPABASE_KEY_MISSING',
      'SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY) is not configured in backend/.env'
    )
  }

  clientInstance = createClient(SUPABASE_URL, key)
  return clientInstance
}

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
