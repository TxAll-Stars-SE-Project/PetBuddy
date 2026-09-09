import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyAuthToken, AuthTokenPayload } from '../utils/jwt.js'

// ขยาย Type ของ Express.Request ให้มีฟิลด์ user เพื่อไม่ให้ TypeScript แจ้งเตือน error
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

/**
 * Middleware สำหรับตรวจสอบ JWT Token จาก Authorization header
 * หากผ่าน จะแนบ payload ({ userId, role }) ลงใน req.user
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAuthToken(token)
    req.user = payload
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired' })
      return
    }

    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid or malformed token' })
  }
}

/**
 * Middleware สำหรับตรวจสอบสิทธิ์ตามบทบาท (Role-based access control)
 * ตัวอย่างการเรียกใช้: authorize('owner') หรือ authorize('owner', 'sitter')
 */
export const authorize = (...roles: ('owner' | 'sitter')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' })
      return
    }

    next()
  }
}
