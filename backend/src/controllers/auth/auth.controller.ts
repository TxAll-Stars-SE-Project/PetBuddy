import { randomBytes } from 'crypto'
import { Request, Response } from 'express'
import { validateLoginInput, validateRegisterInput } from '../../validators/auth.validator.js'
import * as authService from '../../services/auth.service.js'
import { AppError } from '../../utils/errors.js'
import prisma from '../../utils/prisma.js'
import { comparePassword, hashPassword } from '../../utils/password.js'
import { signAuthToken } from '../../utils/jwt.js'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { sendPasswordResetEmail } from '../../utils/email.js'

const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 15)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''

  if (!email) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }

  // Always respond 200 regardless of outcome below, to avoid leaking
  // whether an email is registered (account enumeration).
  try {
    const user = await prisma.uSER.findUnique({ where: { email } })

    if (user) {
      const token = randomBytes(32).toString('hex')
      const expiresat = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000)

      await prisma.passwordresettoken.create({
        data: { token, userid: user.userid, expiresat },
      })

      const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`

      try {
        await sendPasswordResetEmail(user.email, resetLink)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
      }
    } else {
      console.warn(`Forgot-password request for unknown email: ${email}`)
    }
  } catch (error) {
    console.error('Error during forgot-password:', error)
  }

  res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' })
}

const isPasswordValid = (password: string): boolean =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.body?.token === 'string' ? req.body.token : ''
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''

  if (!token || !newPassword) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }

  if (!isPasswordValid(newPassword)) {
    res.status(400).json({ error: 'INVALID_PASSWORD' })
    return
  }

  try {
    const resetToken = await prisma.passwordresettoken.findUnique({
      where: { token },
      include: { USER: true },
    })

    if (!resetToken) {
      res.status(400).json({ error: 'TOKEN_INVALID' })
      return
    }

    if (resetToken.expiresat < new Date()) {
      await prisma.passwordresettoken.delete({ where: { token } })
      res.status(400).json({ error: 'TOKEN_EXPIRED' })
      return
    }

    const isSameAsOldPassword = await comparePassword(newPassword, resetToken.USER.password)
    if (isSameAsOldPassword) {
      res.status(400).json({ error: 'SAME_AS_OLD_PASSWORD' })
      return
    }

    const hashed = await hashPassword(newPassword)

    await prisma.$transaction([
      prisma.uSER.update({ where: { userid: resetToken.userid }, data: { password: hashed } }),
      prisma.passwordresettoken.deleteMany({ where: { userid: resetToken.userid } }),
    ])

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' })
  } catch (error) {
    console.error('Error during reset-password:', error)
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
}
