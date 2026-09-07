export interface RegisterInput {
  username?: string
  name?: string
  email?: string
  password?: string
  role?: 'owner' | 'sitter' | string
  tel?: string
  province?: string
  city?: string
  postalCode?: string
  postal_code?: string
  thaiId?: string
  thaiid?: string
  experience?: string
}

export interface ValidationError {
  field: string
  message: string
}

export const validateRegisterInput = (data: RegisterInput) => {
  const errors: ValidationError[] = []

  const username = (data.username || data.name || '').trim()
  const email = (data.email || '').trim().toLowerCase()
  const password = data.password || ''
  const role = data.role
  const thaiId = (data.thaiId || data.thaiid || '').trim()

  if (!username || username.length < 3) {
    errors.push({ field: 'username', message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  }

  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' })
  }

  if (!role || !['owner', 'sitter'].includes(role)) {
    errors.push({ field: 'role', message: 'กรุณาเลือกบทบาท (owner หรือ sitter)' })
  }

  if (role === 'sitter') {
    if (!thaiId || !/^\d{13}$/.test(thaiId)) {
      errors.push({ field: 'thaiId', message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' })
    }
  }

  return errors
}
