import { CreatePetInput } from '../types/pet.js'
import { ValidationError } from '../types/user.js'
import { AppError } from '../utils/errors.js'
import { isEmpty, toCleanString, calculateAge, calculateBirthDateFromAge } from '../utils/helpers.js'

export const validateCreatePetInput = (data: unknown): CreatePetInput => {
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const errors: ValidationError[] = []

  // 1. Name (Required, 1-50 chars)
  const name = toCleanString(body.name)
  if (isEmpty(body.name)) {
    errors.push({ field: 'name', message: 'กรุณากรอกชื่อสัตว์เลี้ยง' })
  } else if (name.length > 50) {
    errors.push({ field: 'name', message: 'ชื่อสัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
  }

  // 2. Species (Optional, max 50 chars)
  const species = toCleanString(body.species)
  if (species.length > 50) {
    errors.push({ field: 'species', message: 'สายพันธุ์/ประเภทสัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
  }

  // 3. Breed (Optional, max 50 chars)
  const breed = toCleanString(body.breed)
  if (breed.length > 50) {
    errors.push({ field: 'breed', message: 'พันธุ์สัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
  }

  // 4. Age & Birth Date
  let b_date: Date | null = null
  let ageNum: number | null = null

  if (!isEmpty(body.b_date) || !isEmpty(body.birthday)) {
    const rawDate = body.b_date || body.birthday
    const parsed = new Date(rawDate as string | number | Date)
    if (isNaN(parsed.getTime())) {
      errors.push({ field: 'b_date', message: 'รูปแบบวันเกิดไม่ถูกต้อง' })
    } else if (parsed > new Date()) {
      errors.push({ field: 'b_date', message: 'วันเกิดต้องไม่เป็นวันที่ในอนาคต' })
    } else {
      b_date = parsed
      ageNum = calculateAge(parsed)
    }
  } else if (!isEmpty(body.age)) {
    const parsedAge = Number(body.age)
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 100) {
      errors.push({ field: 'age', message: 'อายุต้องเป็นตัวเลขที่ถูกต้อง (0 - 100)' })
    } else {
      ageNum = parsedAge
      b_date = calculateBirthDateFromAge(parsedAge)
    }
  }

  // 5. Gender (Optional, max 20 chars)
  const gender = toCleanString(body.gender)
  if (gender.length > 20) {
    errors.push({ field: 'gender', message: 'เพศต้องไม่เกิน 20 ตัวอักษร' })
  }

  // 6. Weight (Optional, numeric)
  let weightNum: number | null = null
  if (!isEmpty(body.weight)) {
    const parsedWeight = Number(body.weight)
    if (isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 999.99) {
      errors.push({ field: 'weight', message: 'น้ำหนักต้องเป็นตัวเลขบวกที่ถูกต้อง' })
    } else {
      weightNum = parsedWeight
    }
  }

  // 7. Allergy / Notes (Optional)
  const allergy = toCleanString(body.allergy || body.notes)

  // 8. Photo / Image URL (Optional)
  const image_url = toCleanString(body.image_url || body.photo)

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง', errors)
  }

  return {
    name,
    species: species || null,
    breed: breed || null,
    age: ageNum,
    b_date,
    gender: gender || null,
    weight: weightNum,
    allergy: allergy || null,
    notes: allergy || null,
    image_url: image_url || null,
    photo: image_url || null,
  }
}
