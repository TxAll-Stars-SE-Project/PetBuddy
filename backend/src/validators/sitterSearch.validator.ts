import { AppError } from '../utils/errors.js'
import { SERVICE_TYPES, SPECIES } from './service.validator.js'
import { canonicalizeProvinceDistrict } from './thaiAddress.validator.js'

const MAX_PRICE = 1_000_000

export interface SitterSearchInput {
  province?: string
  district?: string
  petType?: string
  category?: string
  minPrice?: number
  maxPrice?: number
}

// query string ที่ว่างเปล่า ("?category=") ถือว่าไม่ได้ส่งตัวกรองนั้นมา
const readString = (
  q: Record<string, unknown>,
  field: string,
  errors: { field: string; message: string }[]
): string | undefined => {
  const raw = q[field]
  if (raw === undefined) return undefined
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${field} must be a single value` })
    return undefined
  }
  const value = raw.trim()
  return value === '' ? undefined : value
}

const readPrice = (
  q: Record<string, unknown>,
  field: 'minPrice' | 'maxPrice',
  errors: { field: string; message: string }[]
): number | undefined => {
  const raw = readString(q, field, errors)
  if (raw === undefined) return undefined
  if (!/^\d+$/.test(raw)) {
    errors.push({ field, message: `${field} must be a non-negative integer` })
    return undefined
  }
  const value = Number(raw)
  if (value > MAX_PRICE) {
    errors.push({ field, message: `${field} must not exceed 1,000,000` })
    return undefined
  }
  return value
}

export const validateSitterSearchQuery = (query: unknown): SitterSearchInput => {
  const errors: { field: string; message: string }[] = []
  const q = (query ?? {}) as Record<string, unknown>

  const category = readString(q, 'category', errors)
  if (category !== undefined && !SERVICE_TYPES.includes(category))
    errors.push({ field: 'category', message: `category must be one of: ${SERVICE_TYPES.join(', ')}` })

  const petType = readString(q, 'petType', errors)
  if (petType !== undefined && !SPECIES.includes(petType))
    errors.push({ field: 'petType', message: `petType must be one of: ${SPECIES.join(', ')}` })

  const minPrice = readPrice(q, 'minPrice', errors)
  const maxPrice = readPrice(q, 'maxPrice', errors)
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
    errors.push({ field: 'minPrice', message: 'minPrice must not be greater than maxPrice' })

  // area: แปลงเป็นชื่อมาตรฐานเดียวกับที่ USER เก็บ (ตัดคำนำหน้า เขต/อำเภอ)
  const provinceInput = readString(q, 'province', errors)
  const districtInput = readString(q, 'district', errors)
  const area = canonicalizeProvinceDistrict(provinceInput ?? '', districtInput ?? '')
  errors.push(...area.errors)

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', errors)
  }

  return { province: area.province, district: area.district, petType, category, minPrice, maxPrice }
}
