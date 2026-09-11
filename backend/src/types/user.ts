export type UserRole = 'owner' | 'sitter'
export interface ValidationError {
  field: string
  message: string
}

export interface RegisterInput {
  username: string
  name?: string
  email: string
  password: string
  role: UserRole | string
  tel: string
  province: string
  district: string
  subdistrict: string
  subDistrict?: string
  postalCode: string
  postal_code?: string
  address?: string
  thaiId?: string
  thaiid?: string
  experience?: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}

export interface EmailDomainValidationResult {
  isValid: boolean
  error?: string
}

export interface PhoneValidationResult {
  isValid: boolean
  normalized?: string
  error?: string
}

export interface ThaiAddressValidationResult {
  isValid: boolean
  errors: ValidationError[]
  normalized?: {
    province: string
    district: string
    subdistrict: string
    postalCode: string
  }
}