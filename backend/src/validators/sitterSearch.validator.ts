import { AppError } from '../utils/errors.js'
import { SERVICE_TYPES, SPECIES } from './service.validator.js'
import { canonicalizeProvinceDistrict } from './thaiAddress.validator.js'

const MAX_PRICE = 1_000_000
const MAX_KEYWORD_LENGTH = 100
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const MAX_PAGE = 100_000
const MIN_RATING = 1
const MAX_RATING = 5

export const SORT_OPTIONS = ['rating', 'priceAsc', 'priceDesc'] as const
export type SitterSort = (typeof SORT_OPTIONS)[number]

export interface SitterSearchInput {
  q?: string
  province?: string
  district?: string
  petType?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort: SitterSort
  page: number
  limit: number
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

// page / limit: จำนวนเต็มบวก (ถ้าไม่ส่งใช้ค่าเริ่มต้น)
const readPositiveInt = (
  q: Record<string, unknown>,
  field: 'page' | 'limit',
  fallback: number,
  max: number,
  errors: { field: string; message: string }[]
): number => {
  const raw = readString(q, field, errors)
  if (raw === undefined) return fallback
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    errors.push({ field, message: `${field} must be a positive integer` })
    return fallback
  }
  const value = Number(raw)
  if (value > max) {
    errors.push({ field, message: `${field} must not exceed ${max}` })
    return fallback
  }
  return value
}

export const validateSitterSearchQuery = (query: unknown): SitterSearchInput => {
  const errors: { field: string; message: string }[] = []
  const q = (query ?? {}) as Record<string, unknown>

  // q: คำค้นหาตามชื่อผู้ใช้ (username) ของพี่เลี้ยง
  const keyword = readString(q, 'q', errors)
  if (keyword !== undefined && keyword.length > MAX_KEYWORD_LENGTH)
    errors.push({ field: 'q', message: `q must not exceed ${MAX_KEYWORD_LENGTH} characters` })

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

  // minRating: จำนวนเต็ม 1-5 (ไม่ส่ง = ไม่กรองตามคะแนน)
  const minRatingRaw = readString(q, 'minRating', errors)
  let minRating: number | undefined
  if (minRatingRaw !== undefined) {
    const n = Number(minRatingRaw)
    if (!/^\d+$/.test(minRatingRaw) || n < MIN_RATING || n > MAX_RATING)
      errors.push({ field: 'minRating', message: `minRating must be an integer between ${MIN_RATING} and ${MAX_RATING}` })
    else minRating = n
  }

  const sortRaw = readString(q, 'sort', errors)
  let sort: SitterSort = 'rating'
  if (sortRaw !== undefined) {
    if (!(SORT_OPTIONS as readonly string[]).includes(sortRaw))
      errors.push({ field: 'sort', message: `sort must be one of: ${SORT_OPTIONS.join(', ')}` })
    else sort = sortRaw as SitterSort
  }

  const page = readPositiveInt(q, 'page', 1, MAX_PAGE, errors)
  const limit = readPositiveInt(q, 'limit', DEFAULT_LIMIT, MAX_LIMIT, errors)

  // area: แปลงเป็นชื่อมาตรฐานเดียวกับที่ USER เก็บ (ตัดคำนำหน้า เขต/อำเภอ)
  const provinceInput = readString(q, 'province', errors)
  const districtInput = readString(q, 'district', errors)
  const area = canonicalizeProvinceDistrict(provinceInput ?? '', districtInput ?? '')
  errors.push(...area.errors)

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', errors)
  }

  return { q: keyword, province: area.province, district: area.district, petType, category, minPrice, maxPrice, minRating, sort, page, limit }
}
