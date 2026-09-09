import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'
import { comparePassword } from '../utils/password.js'
import { signAuthToken } from '../utils/jwt.js'

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    res.status(400).json({ error: 'MISSING_FIELDS' })
    return
  }

  try {
    const user = await prisma.uSER.findUnique({
      where: { email },
      include: { petowner: true, petsitter: true },
    })

    if (!user) {
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }

    const passwordMatches = await comparePassword(password, user.password)
    if (!passwordMatches) {
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }

    const role = user.petsitter ? 'sitter' : 'owner'
    const token = signAuthToken({ userId: user.userid, role })

    res.status(200).json({
      token,
      user: {
        username: user.username,
        email: user.email,
        role,
      },
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
}
