import { CreatePetInput, UpdatePetInput } from '../types/pet.js'
import { ValidationError } from '../types/user.js'
import { AppError } from '../utils/errors.js'
import { isEmpty, toCleanString, calculateAge, calculateBirthDateFromAge } from '../utils/helpers.js'

interface ValidatePetOptions {
  isUpdate?: boolean
}

export const validatePetInput = (
  data: unknown,
  options: ValidatePetOptions = {}
): CreatePetInput | UpdatePetInput => {
  const isUpdate = options.isUpdate === true
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const errors: ValidationError[] = []

  // 1. Name
  let name: string | undefined = undefined
  if (body.name !== undefined || !isUpdate) {
    name = toCleanString(body.name)
    if (isEmpty(body.name)) {
      errors.push({
        field: 'name',
        message: isUpdate ? 'ชื่อสัตว์เลี้ยงต้องไม่เป็นค่าว่าง' : 'กรุณากรอกชื่อสัตว์เลี้ยง',
      })
    } else if (name.length > 50) {
      errors.push({ field: 'name', message: 'ชื่อสัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
    }
  }

  // 2. Species
  let species: string | null | undefined = undefined
  if (body.species !== undefined || !isUpdate) {
    species = toCleanString(body.species) || null
    if (species && species.length > 50) {
      errors.push({ field: 'species', message: 'สายพันธุ์/ประเภทสัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
    }
  }

  // 3. Breed
  let breed: string | null | undefined = undefined
  if (body.breed !== undefined || !isUpdate) {
    breed = toCleanString(body.breed) || null
    if (breed && breed.length > 50) {
      errors.push({ field: 'breed', message: 'พันธุ์สัตว์เลี้ยงต้องไม่เกิน 50 ตัวอักษร' })
    }
  }

  // 4. Age & Birth Date
  let b_date: Date | null | undefined = undefined
  let ageNum: number | null | undefined = undefined

  const hasDate = body.b_date !== undefined || body.birthday !== undefined
  const hasAge = body.age !== undefined

  if (hasDate && (!isEmpty(body.b_date) || !isEmpty(body.birthday))) {
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
  } else if (hasAge && !isEmpty(body.age)) {
    const parsedAge = Number(body.age)
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 100) {
      errors.push({ field: 'age', message: 'อายุต้องเป็นตัวเลขที่ถูกต้อง (0 - 100)' })
    } else {
      ageNum = parsedAge
      b_date = calculateBirthDateFromAge(parsedAge)
    }
  } else if (!isUpdate) {
    b_date = null
    ageNum = null
  }

  // 5. Gender
  let gender: string | null | undefined = undefined
  if (body.gender !== undefined || !isUpdate) {
    gender = toCleanString(body.gender) || null
    if (gender && gender.length > 20) {
      errors.push({ field: 'gender', message: 'เพศต้องไม่เกิน 20 ตัวอักษร' })
    }
  }

  // 6. Weight
  let weightNum: number | null | undefined = undefined
  if (body.weight !== undefined || !isUpdate) {
    if (!isEmpty(body.weight)) {
      const parsedWeight = Number(body.weight)
      if (isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 999.99) {
        errors.push({ field: 'weight', message: 'น้ำหนักต้องเป็นตัวเลขบวกที่ถูกต้อง' })
      } else {
        weightNum = parsedWeight
      }
    } else {
      weightNum = null
    }
  }

  // 7. Allergy / Notes
  let allergy: string | null | undefined = undefined
  if (body.allergy !== undefined || body.notes !== undefined || !isUpdate) {
    allergy = toCleanString(body.allergy || body.notes) || null
  }

  // 8. Photo / Image URL
  let image_url: string | null | undefined = undefined
  if (body.image_url !== undefined || body.photo !== undefined || !isUpdate) {
    image_url = toCleanString(body.image_url || body.photo) || null
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง', errors)
  }

  if (isUpdate) {
    const result: UpdatePetInput = {}
    if (name !== undefined) result.name = name
    if (species !== undefined) result.species = species
    if (breed !== undefined) result.breed = breed
    if (b_date !== undefined) result.b_date = b_date
    if (ageNum !== undefined) result.age = ageNum
    if (gender !== undefined) result.gender = gender
    if (weightNum !== undefined) result.weight = weightNum
    if (allergy !== undefined) {
      result.allergy = allergy
      result.notes = allergy
    }
    if (image_url !== undefined) {
      result.image_url = image_url
      result.photo = image_url
    }
    return result
  }

  return {
    name: name!,
    species: species || null,
    breed: breed || null,
    age: ageNum || null,
    b_date: b_date || null,
    gender: gender || null,
    weight: weightNum !== undefined ? weightNum : null,
    allergy: allergy || null,
    notes: allergy || null,
    image_url: image_url || null,
    photo: image_url || null,
  }
}

export const validateCreatePetInput = (data: unknown): CreatePetInput => {
  return validatePetInput(data, { isUpdate: false }) as CreatePetInput
}

export const validateUpdatePetInput = (data: unknown): UpdatePetInput => {
  return validatePetInput(data, { isUpdate: true }) as UpdatePetInput
}
