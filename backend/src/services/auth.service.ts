import { Prisma } from '../generated/prisma/client.js'
import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { AppError } from '../utils/errors.js'
import { RegisterInput, UserRole } from '../types/user.js'

export const registerUser = async (data: RegisterInput) => {
  const username = (data.username || data.name || '').trim()
  const email = (data.email || '').trim().toLowerCase()
  const thaiId = (data.thaiId || data.thaiid || '').trim()
  const postal = (data.postalCode || data.postal_code || '').trim()
  const role = data.role as UserRole
  const password = data.password!

  // 1. Hash Password
  const hashedPassword = await hashPassword(password)

  // 2. บันทึกลงฐานข้อมูลด้วย Transaction และให้ Prisma ตรวจสอบ Unique Constraints
  try {
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.uSER.create({
        data: {
          username,
          email,
          password: hashedPassword,
          tel: data.tel ? String(data.tel).trim() : null,
          province: data.province ? String(data.province).trim() : null,
          city: data.city ? String(data.city).trim() : null,
          postal_code: postal || null,
        },
      })

      if (role === 'sitter') {
        await tx.petsitter.create({
          data: {
            userid: user.userid,
            thaiid: thaiId,
            experience: data.experience ? String(data.experience).trim() : null,
          },
        })
      } else {
        await tx.petowner.create({
          data: {
            userid: user.userid,
          },
        })
      }

      return user
    })

    return {
      userId: newUser.userid,
      user: {
        id: newUser.userid,
        username: newUser.username,
        email: newUser.email,
        role,
      },
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const targetStr = Array.isArray(error.meta?.target)
        ? error.meta.target.join(' ').toLowerCase()
        : typeof error.meta?.target === 'string'
        ? error.meta.target.toLowerCase()
        : ''

      if (targetStr.includes('email')) {
        throw new AppError(409, 'EMAIL_DUPLICATE', 'Email already registered')
      }
      if (targetStr.includes('username')) {
        throw new AppError(409, 'USERNAME_DUPLICATE', 'Username already registered', [
          { field: 'username', message: 'Username already registered' },
        ])
      }
      if (targetStr.includes('thaiid')) {
        throw new AppError(409, 'THAI_ID_DUPLICATE', 'Thai ID already registered', [
          { field: 'thaiId', message: 'Thai ID already registered' },
        ])
      }

      throw new AppError(409, 'DUPLICATE_RESOURCE', 'A user with this credential already exists')
    }

    throw error
  }
}
