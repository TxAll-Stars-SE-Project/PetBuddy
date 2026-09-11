import { Request, Response } from 'express'
import { validateLoginInput, validateRegisterInput } from '../../validators/auth.validator.js'
import * as authService from '../../services/auth.service.js'
import { AppError } from '../../utils/errors.js'
import prisma from '../../utils/prisma.js'
import { comparePassword } from '../../utils/password.js'
import { signAuthToken } from '../../utils/jwt.js'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = validateLoginInput(req.body)

    const user = await prisma.uSER.findUnique({
      where: { email },
      include: { petowner: true, petsitter: true },
    })

    if (!user) {
      // Internal-only distinction for logs/debugging; the client always gets
      // the same generic error below to avoid leaking whether an email is registered.
      console.warn(`Login failed: no user for email ${email}`)
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }

    const passwordMatches = await comparePassword(password, user.password)
    if (!passwordMatches) {
      console.warn(`Login failed: wrong password for userId ${user.userid}`)
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }

    const role = user.petsitter ? 'sitter' : 'owner'
    const token = signAuthToken({ userId: user.userid, role }, rememberMe === true)

    res.status(200).json({
      token,
      user: {
        username: user.username,
        email: user.email,
        role,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error during login:', error)
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedInput = await validateRegisterInput(req.body)
    const result = await authService.registerUser(validatedInput)

    // 2. ตอบกลับเมื่อสำเร็จ (201 Created)
    res.status(201).json({
      success: true,
      ...result,
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error during registration:', error)
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register user',
      detail: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

// Assumes requireAuth ran first: token is already verified and confirmed
// not blacklisted, with req.token/req.auth populated.
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await prisma.tokenblacklist.create({
      data: {
        token: req.token!,
        expiresat: new Date(req.auth!.exp! * 1000),
      },
    })

    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
}
