export type UserRole = 'owner' | 'sitter'

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
