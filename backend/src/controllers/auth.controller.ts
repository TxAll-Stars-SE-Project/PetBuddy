import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'
import { comparePassword } from '../utils/password.js'
import { signAuthToken } from '../utils/jwt.js'

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body ?? {}

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
    console.error('Error during login:', error)
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
}
