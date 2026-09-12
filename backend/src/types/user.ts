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

export interface PetProfileResponse {
  petid: number
  name: string
  species: string | null
  breed: string | null
  gender: string | null
  birthDate: string | null
  age: number | null
  weight: number | null
  allergy: string | null
  imageUrl: string | null
}

export interface BaseProfileResponse {
  userId: number
  username: string
  email: string
  tel: string | null
  province: string | null
  district: string | null
  subdistrict: string | null
  postalCode: string | null
  address: string | null
}

export interface OwnerProfileResponse extends BaseProfileResponse {
  role: 'owner'
  pets: PetProfileResponse[]
}

export interface SitterProfileResponse extends BaseProfileResponse {
  role: 'sitter'
  thaiId: string | null
  experience: string | null
}

export type UserProfileResponse = OwnerProfileResponse | SitterProfileResponse

