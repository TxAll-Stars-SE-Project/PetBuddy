import { UserRole } from '../types/user.js'

export interface RegisterInput {
  username?: string
  name?: string
  email?: string
  password?: string
  role?: UserRole | string
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

export const isThaiIDValid = (id: string): boolean => {
  if (id.length !== 13 || !/^\d{13}$/.test(id)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i), 10) * (13 - i)
  }
  return (11 - (sum % 11)) % 10 === parseInt(id.charAt(12), 10)
}

export const validateRegisterInput = (data: RegisterInput) => {
  const errors: ValidationError[] = []

  const username = (data.username || data.name || '').trim()
  const email = (data.email || '').trim().toLowerCase()
  const password = data.password || ''
  const role = data.role
  const thaiId = (data.thaiId || data.thaiid || '').trim()

  if (!username || username.length < 3) {
    errors.push({ field: 'username', message: 'At least 3 characters' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid format' })
  }

  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'At least 8 characters' })
  }

  if (!role || !['owner', 'sitter'].includes(role)) {
    errors.push({ field: 'role', message: 'please select role' })
  }

  if (role === 'sitter') {
    if (!thaiId || !isThaiIDValid(thaiId)) {
      errors.push({ field: 'thaiId', message: 'Invalid format' })
    }
  }

  return errors
}
