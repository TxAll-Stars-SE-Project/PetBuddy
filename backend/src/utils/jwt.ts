import jwt from 'jsonwebtoken'
import { UserRole } from '../types/user.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d'
const JWT_EXPIRES_IN_REMEMBER_ME = process.env.JWT_EXPIRES_IN_REMEMBER_ME ?? '30d'

export interface AuthTokenPayload {
  userId: number
  role: UserRole
}

export const signAuthToken = (payload: AuthTokenPayload, rememberMe = false): string =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? JWT_EXPIRES_IN_REMEMBER_ME : JWT_EXPIRES_IN,
  } as jwt.SignOptions)

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, JWT_SECRET) as AuthTokenPayload
