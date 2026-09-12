import { ValidationError } from '../types/user.js'
import { AppError } from '../utils/errors.js'
import { isEmpty, toCleanString } from '../utils/helpers.js'
import { validateThaiAddress } from './thaiAddress.validator.js'
import { validateEmailDomain } from './emailDomain.validator.js'
import { validateAndNormalizeThaiPhone } from './phone.validator.js'

/** ฟิลด์ที่ยอมให้แก้ผ่าน PUT /api/users/me — userid/password/role ไม่อยู่ในนี้โดยตั้งใจ */
export interface UpdateProfileInput {
  username?: string
  email?: string
  tel?: string
  province?: string
  district?: string
  subdistrict?: string
  postal_code?: string
  address?: string | null
}

/** ชื่อฟิลด์ที่ frontend อาจส่งมาได้หลายแบบ (camelCase / snake_case / ชื่อเดิม) */
const ADDRESS_ALIASES = {
  province: ['province'],
  district: ['district', 'city'],
  subdistrict: ['subdistrict', 'subDistrict', 'tambon'],
  postalCode: ['postalCode', 'postal_code'],
} as const

const pick = (body: Record<string, unknown>, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) return key
  }
  return undefined
}

/**
 * ตรวจ body ของ PUT /api/users/me
 *
 * - อัปเดตเฉพาะฟิลด์ที่ส่งมา (partial update) ฟิลด์ที่ไม่ส่งมาจะไม่ถูกแตะ
 * - ที่อยู่ต้องส่งมาครบทั้ง 4 ส่วนพร้อมกัน เพราะ validateThaiAddress ตรวจความสัมพันธ์
 *   จังหวัด → อำเภอ → ตำบล → รหัสไปรษณีย์ ว่าตรงกันจริงหรือไม่
 * - ฟิลด์ที่ไม่รู้จัก (role, thaiId, experience, userid, password) จะถูกเมินทั้งหมด
 *
 * โยน AppError(400) เมื่อไม่ผ่าน — รูปแบบเดียวกับ validateRegisterInput
 */
export const validateUpdateProfileInput = async (data: unknown): Promise<UpdateProfileInput> => {
  const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const errors: ValidationError[] = []
  const result: UpdateProfileInput = {}

  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  // 1. Username
  if (has('username')) {
    const username = toCleanString(body.username)
    if (isEmpty(body.username)) {
      errors.push({ field: 'username', message: 'กรุณากรอกชื่อผู้ใช้' })
    } else if (username.length < 3) {
      errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร' })
    } else if (username.length > 50) {
      errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร' })
    } else {
      result.username = username
    }
  }

  // 2. Email + ตรวจว่าโดเมนมีเซิร์ฟเวอร์รับอีเมลจริง
  if (has('email')) {
    const email = toCleanString(body.email).toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (isEmpty(body.email)) {
      errors.push({ field: 'email', message: 'กรุณากรอกอีเมล' })
    } else if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' })
    } else if (email.length > 100) {
      errors.push({ field: 'email', message: 'อีเมลต้องไม่เกิน 100 ตัวอักษร' })
    } else {
      const domainCheck = await validateEmailDomain(email)
      if (!domainCheck.isValid && domainCheck.error) {
        errors.push({ field: 'email', message: domainCheck.error })
      } else {
        result.email = email
      }
    }
  }

  // 3. Tel
  if (has('tel')) {
    if (isEmpty(body.tel)) {
      errors.push({ field: 'tel', message: 'กรุณากรอกเบอร์โทร' })
    } else {
      const phoneCheck = validateAndNormalizeThaiPhone(toCleanString(body.tel))
      if (!phoneCheck.isValid && phoneCheck.error) {
        errors.push({ field: 'tel', message: phoneCheck.error })
      } else if (phoneCheck.normalized) {
        result.tel = phoneCheck.normalized
      }
    }
  }

  // 4. ที่อยู่ — ต้องมาครบ 4 ส่วนถึงจะตรวจความสัมพันธ์กันได้
  const provinceKey = pick(body, ADDRESS_ALIASES.province)
  const districtKey = pick(body, ADDRESS_ALIASES.district)
  const subdistrictKey = pick(body, ADDRESS_ALIASES.subdistrict)
  const postalKey = pick(body, ADDRESS_ALIASES.postalCode)
  const addressKeys = [provinceKey, districtKey, subdistrictKey, postalKey]

  if (addressKeys.some(Boolean)) {
    const province = toCleanString(provinceKey ? body[provinceKey] : '')
    const district = toCleanString(districtKey ? body[districtKey] : '')
    const subdistrict = toCleanString(subdistrictKey ? body[subdistrictKey] : '')
    const postalCode = toCleanString(postalKey ? body[postalKey] : '')

    let hasEmpty = false
    if (!province) {
      errors.push({ field: 'province', message: 'กรุณากรอกจังหวัด' })
      hasEmpty = true
    }
    if (!district) {
      errors.push({ field: 'district', message: 'กรุณากรอกอำเภอ/เขต' })
      hasEmpty = true
    }
    if (!subdistrict) {
      errors.push({ field: 'subdistrict', message: 'กรุณากรอกตำบล/แขวง' })
      hasEmpty = true
    }
    if (!postalCode) {
      errors.push({ field: 'postalCode', message: 'กรุณากรอกรหัสไปรษณีย์' })
      hasEmpty = true
    }

    if (!hasEmpty) {
      const addressCheck = validateThaiAddress(province, district, subdistrict, postalCode)
      if (!addressCheck.isValid) {
        errors.push(...addressCheck.errors)
      } else if (addressCheck.normalized) {
        result.province = addressCheck.normalized.province
        result.district = addressCheck.normalized.district
        result.subdistrict = addressCheck.normalized.subdistrict
        result.postal_code = addressCheck.normalized.postalCode
      }
    }
  }

  // 5. บ้านเลขที่/รายละเอียดที่อยู่ — เป็น Text ใน DB ล้างค่าได้
  const detailKey = pick(body, ['address', 'addressDetail', 'address_detail'])
  if (detailKey) {
    const address = toCleanString(body[detailKey])
    result.address = address === '' ? null : address
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input data', errors)
  }

  return result
}
