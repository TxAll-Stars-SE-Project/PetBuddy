import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'
import { verifyAuthToken, VerifiedAuthToken } from '../utils/jwt.js'
import { UserRole } from '../types/user.js'

export interface AuthenticatedRequest extends Request {
  token?: string
  auth?: VerifiedAuthToken
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined

  if (!token) {
    res.status(401).json({ error: 'MISSING_TOKEN' })
    return
  }

  try {
    const blacklisted = await prisma.tokenblacklist.findUnique({ where: { token } })
    if (blacklisted) {
      res.status(401).json({ error: 'TOKEN_INVALIDATED' })
      return
    }

    req.auth = verifyAuthToken(token)
    req.token = token
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED' })
      return
    }
    res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

/**
 * Role-based access control. Must run after requireAuth so req.auth is set.
 * Usage: router.get('/path', requireAuth, authorize('owner', 'sitter'), handler)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'FORBIDDEN' })
      return
    }

    next()
  }
}
