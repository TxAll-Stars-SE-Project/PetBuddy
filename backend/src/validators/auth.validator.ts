import { RegisterInput, LoginInput } from '../types/user.js'
import { AppError } from '../utils/errors.js'
import { isEmpty, toCleanString, isThaiIDValid, ValidationError } from '../utils/helpers.js'

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

export const validateRegisterInput = (data: unknown): RegisterInput => {
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const errors: ValidationError[] = []

  const username = toCleanString(body.username || body.name)
  const email = toCleanString(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const role = toCleanString(body.role)
  const tel = toCleanString(body.tel).replace(/[\s-]/g, '')
  const province = toCleanString(body.province)
  const district = toCleanString(body.district || body.city)
  const subdistrict = toCleanString(body.subdistrict || body.subDistrict || body.tambon)
  const postalCode = toCleanString(body.postalCode || body.postal_code)
  const address = toCleanString(body.address || body.addressDetail || body.address_detail)
  const thaiId = toCleanString(body.thaiId || body.thaiid)
  const experience = toCleanString(body.experience)

  if (isEmpty(body.username) && isEmpty(body.name)) {
    errors.push({ field: 'username', message: 'กรุณากรอกชื่อผู้ใช้' })
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร' })
  } else if (username.length > 50) {
    errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร' })
  }

  // 2. Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (isEmpty(body.email)) {
    errors.push({ field: 'email', message: 'กรุณากรอกอีเมล' })
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' })
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

  // 5. Tel
  if (isEmpty(body.tel)) {
    errors.push({ field: 'tel', message: 'กรุณากรอกเบอร์โทร' })
  } else if (!/^0\d{9}$/.test(tel)) {
    errors.push({ field: 'tel', message: 'เบอร์โทรต้องขึ้นต้นด้วย 0 และยาว 10 หลัก' })
  }

  // 6. Province
  if (isEmpty(body.province)) {
    errors.push({ field: 'province', message: 'กรุณากรอกจังหวัด' })
  } else if (province.length > 100) {
    errors.push({ field: 'province', message: 'จังหวัดต้องไม่เกิน 100 ตัวอักษร' })
  }

  // 7. District (อำเภอ/เขต)
  if (isEmpty(district)) {
    errors.push({ field: 'district', message: 'กรุณากรอกอำเภอ/เขต' })
  } else if (district.length > 100) {
    errors.push({ field: 'district', message: 'อำเภอ/เขตต้องไม่เกิน 100 ตัวอักษร' })
  }

  // 8. Subdistrict (ตำบล/แขวง)
  if (isEmpty(subdistrict)) {
    errors.push({ field: 'subdistrict', message: 'กรุณากรอกตำบล/แขวง' })
  } else if (subdistrict.length > 100) {
    errors.push({ field: 'subdistrict', message: 'ตำบล/แขวงต้องไม่เกิน 100 ตัวอักษร' })
  }

  // 9. Postal Code
  if (isEmpty(body.postalCode) && isEmpty(body.postal_code)) {
    errors.push({ field: 'postalCode', message: 'กรุณากรอกรหัสไปรษณีย์' })
  } else if (!/^\d{5}$/.test(postalCode)) {
    errors.push({ field: 'postalCode', message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก' })
  }

  // 10. Sitter-specific fields
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
    tel,
    province,
    district,
    subdistrict,
    postalCode,
    address,
    ...(role === 'sitter' ? { thaiId, experience } : {}),
  }
}
