import { AppError } from '../utils/errors.js'

const SERVICE_TYPES = ['walking', 'sitting', 'boarding', 'grooming', 'daycare']
const SPECIES = ['dog', 'cat', 'bird', 'exotic']

export interface CreateServiceInput {
  serviceName: string
  serviceType: string
  species: string[]
  price: number
  description?: string
}

export const validateCreateServiceInput = (body: unknown): CreateServiceInput => {
  const errors: { field: string; message: string }[] = []
  const b = (body ?? {}) as Record<string, unknown>

  // serviceName: ต้องมี, ไม่เกิน 255 (ตาม @db.VarChar(255))
  const serviceName = typeof b.serviceName === 'string' ? b.serviceName.trim() : ''
  if (!serviceName) errors.push({ field: 'serviceName', message: 'Service name is required' })
  else if (serviceName.length > 255) errors.push({ field: 'serviceName', message: 'Service name must not exceed 255 characters' })

  // serviceType: ต้องเป็นคำใน enum ใหม่เท่านั้น (คำเก่า pet_sitting ต้องโดน 400!)
  const serviceType = typeof b.serviceType === 'string' ? b.serviceType.trim() : ''
  if (!serviceType) errors.push({ field: 'serviceType', message: 'Service type is required' })
  else if (!SERVICE_TYPES.includes(serviceType))
    errors.push({ field: 'serviceType', message: `Service type must be one of: ${SERVICE_TYPES.join(', ')}` })

  // species: optional (default []) แต่ถ้าส่งมาต้องเป็น array ของคำที่อนุญาต
  let species: string[] = []
  if (b.species !== undefined) {
    if (!Array.isArray(b.species)) errors.push({ field: 'species', message: 'Species must be an array' })
    else {
      const invalid = (b.species as unknown[]).find((s) => typeof s !== 'string' || !SPECIES.includes(s))
      if (invalid !== undefined) errors.push({ field: 'species', message: `Invalid species: ${String(invalid)}` })
      else species = b.species as string[]
    }
  }

  // price: จำนวนเต็มบวกเท่านั้น (กัน 0, ติดลบ, ทศนิยม, string)
  const price = b.price
  let priceValue = 0                                   // 👈 ตัวแปรปลายทาง type number ชัดเจน
  if (price === undefined || price === null || price === '') errors.push({ field: 'price', message: 'Price is required' })
  else if (typeof price !== 'number' || !Number.isInteger(price)) errors.push({ field: 'price', message: 'Price must be an integer' })
  else if (price <= 0) errors.push({ field: 'price', message: 'Price must be greater than 0' })
  else if (price > 1_000_000) errors.push({ field: 'price', message: 'Price must not exceed 1,000,000' })
  else priceValue = price                              // 👈 กิ่งนี้ TS รู้ว่า price เป็น number → เก็บได้เลย

  // description: optional ไม่เกิน 2000 ตัว
  const description = typeof b.description === 'string' ? b.description.trim() : undefined
  if (description !== undefined && description.length > 2000)
    errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' })

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', errors)
  }

  return { serviceName, serviceType, species, price: priceValue, description }   // 👈 ใช้ priceValue
}