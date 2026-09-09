import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d'

export interface AuthTokenPayload {
  userId: number
  role: 'owner' | 'sitter'
}

export const signAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, JWT_SECRET) as AuthTokenPayload
