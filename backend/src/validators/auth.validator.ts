import { RegisterInput, LoginInput } from '../types/user.js'
import { AppError } from '../utils/errors.js'
import { isEmpty, toCleanString, isThaiIDValid} from '../utils/helpers.js'
import { validateThaiAddress } from './thaiAddress.validator.js'
import { validateEmailDomain } from './emailDomain.validator.js'
import { validateAndNormalizeThaiPhone } from './phone.validator.js'
import { ValidationError } from '../types/user.js'

export const validateLoginInput = (data: unknown): LoginInput => {
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const email = toCleanString(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const rememberMe = body.rememberMe === true

  if (!email || !password) {
    throw new AppError(400, 'MISSING_FIELDS', 'Email and password are required')
  }

  return { email, password, rememberMe }
}

export const validateRegisterInput = async (data: unknown): Promise<RegisterInput> => {
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const errors: ValidationError[] = []

  const username = toCleanString(body.username || body.name)
  const email = toCleanString(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const role = toCleanString(body.role)
  const rawTel = toCleanString(body.tel)
  const province = toCleanString(body.province)
  const district = toCleanString(body.district || body.city)
  const subdistrict = toCleanString(body.subdistrict || body.subDistrict || body.tambon)
  const postalCode = toCleanString(body.postalCode || body.postal_code)
  const address = toCleanString(body.address || body.addressDetail || body.address_detail)
  const thaiId = toCleanString(body.thaiId || body.thaiid)
  const experience = toCleanString(body.experience)

  // 1. Username
  if (isEmpty(body.username) && isEmpty(body.name)) {
    errors.push({ field: 'username', message: 'กรุณากรอกชื่อผู้ใช้' })
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร' })
  } else if (username.length > 50) {
    errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร' })
  }

  // 2. Email & Domain Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (isEmpty(body.email)) {
    errors.push({ field: 'email', message: 'กรุณากรอกอีเมล' })
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  } else {
    const domainCheck = await validateEmailDomain(email)
    if (!domainCheck.isValid && domainCheck.error) {
      errors.push({ field: 'email', message: domainCheck.error })
    }
  }

  // 3. Password
  if (isEmpty(body.password)) {
    errors.push({ field: 'password', message: 'กรุณากรอกรหัสผ่าน' })
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
  }

  // 4. Role
  if (isEmpty(body.role) || !['owner', 'sitter'].includes(role)) {
    errors.push({ field: 'role', message: 'กรุณาเลือกบทบาท (owner หรือ sitter)' })
  }

  // 5. Tel (Thai Phone validation & normalization)
  let validatedTel = rawTel.replace(/[\s-]/g, '')
  if (isEmpty(body.tel)) {
    errors.push({ field: 'tel', message: 'กรุณากรอกเบอร์โทร' })
  } else {
    const phoneCheck = validateAndNormalizeThaiPhone(rawTel)
    if (!phoneCheck.isValid && phoneCheck.error) {
      errors.push({ field: 'tel', message: phoneCheck.error })
    } else if (phoneCheck.normalized) {
      validatedTel = phoneCheck.normalized
    }
  }

  // 6. Address validation (Province -> District -> Subdistrict -> Postal Code)
  let validatedProvince = province
  let validatedDistrict = district
  let validatedSubdistrict = subdistrict
  let validatedPostalCode = postalCode

  let hasAddressEmptyError = false
  if (isEmpty(province)) {
    errors.push({ field: 'province', message: 'กรุณากรอกจังหวัด' })
    hasAddressEmptyError = true
  }
  if (isEmpty(district)) {
    errors.push({ field: 'district', message: 'กรุณากรอกอำเภอ/เขต' })
    hasAddressEmptyError = true
  }
  if (isEmpty(subdistrict)) {
    errors.push({ field: 'subdistrict', message: 'กรุณากรอกตำบล/แขวง' })
    hasAddressEmptyError = true
  }
  if (isEmpty(postalCode)) {
    errors.push({ field: 'postalCode', message: 'กรุณากรอกรหัสไปรษณีย์' })
    hasAddressEmptyError = true
  }

  if (!hasAddressEmptyError) {
    const addressCheck = validateThaiAddress(province, district, subdistrict, postalCode)
    if (!addressCheck.isValid) {
      errors.push(...addressCheck.errors)
    } else if (addressCheck.normalized) {
      validatedProvince = addressCheck.normalized.province
      validatedDistrict = addressCheck.normalized.district
      validatedSubdistrict = addressCheck.normalized.subdistrict
      validatedPostalCode = addressCheck.normalized.postalCode
    }
  }

  // 7. Sitter-specific fields
  if (role === 'sitter') {
    if (isEmpty(body.thaiId) && isEmpty(body.thaiid)) {
      errors.push({ field: 'thaiId', message: 'กรุณากรอกเลขบัตรประชาชน' })
    } else if (!isThaiIDValid(thaiId)) {
      errors.push({ field: 'thaiId', message: 'เลขบัตรประชาชนไม่ถูกต้อง' })
    }

    if (!experience) {
      errors.push({ field: 'experience', message: 'กรุณากรอกประสบการณ์' })
    }
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input data', errors)
  }

  return {
    username,
    email,
    password,
    role,
    tel: validatedTel,
    province: validatedProvince,
    district: validatedDistrict,
    subdistrict: validatedSubdistrict,
    postalCode: validatedPostalCode,
    address,
    ...(role === 'sitter' ? { thaiId, experience } : {}),
  }
}
