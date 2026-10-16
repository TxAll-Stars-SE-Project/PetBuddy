import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.middleware.js'
import { UserRole } from '../types/user.js'

const ROLE_MESSAGES: Record<UserRole, string> = {
  sitter: 'Sitter role required',
  owner: 'Only pet owner can perform this action',
}

/**
 * ใช้ต่อจาก requireAuth เสมอ: requireAuth เช็ก "ล็อกอินหรือยัง"
 * requireRole เช็ก "role มีสิทธิ์ไหม" — แยกชั้นกันชัด ๆ
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const role = req.auth?.role

    if (!role) {
      res.status(401).json({ status: 'error', error: 'INVALID_TOKEN', message: 'Unauthorized' })
      return
    }

    if (!roles.includes(role)) {
      res.status(403).json({
        status: 'error',
        error: 'ROLE_NOT_ALLOWED',
        message: roles.map((r) => ROLE_MESSAGES[r] ?? `${r} role required`).join(' or '),
      })
      return
    }

    next()
  }
}