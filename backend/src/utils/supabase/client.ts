import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../errors.js'


export const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'petbuddy-images'

let clientInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (clientInstance) return clientInstance

  const supabaseUrl = process.env.SUPABASE_URL
  if (!supabaseUrl) {
    throw new AppError(
      500,
      'SUPABASE_URL_MISSING',
      'SUPABASE_URL is not configured in backend/.env'
    )
  }

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

  clientInstance = createClient(supabaseUrl, key)
  return clientInstance
}
