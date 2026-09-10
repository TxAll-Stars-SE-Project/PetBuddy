import { Request, Response, NextFunction } from 'express'
import prisma from '../utils/prisma.js'
import { verifyAuthToken, VerifiedAuthToken } from '../utils/jwt.js'

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
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}
