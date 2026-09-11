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
  const subdistrict = (data.subdistrict || data.subDistrict || '').trim()
  const role = data.role as UserRole
  const password = data.password!

  // 1. Hash Password
  const hashedPassword = await hashPassword(password)

  // 2. บันทึกลงฐานข้อมูลด้วย Nested Write เพื่อรองรับ Connection Pooler / PgBouncer อย่างเสถียร
  try {
    const newUser = await prisma.uSER.create({
      data: {
        username,
        email,
        password: hashedPassword,
        tel: data.tel ? String(data.tel).trim() : null,
        province: data.province ? String(data.province).trim() : null,
        district: data.district ? String(data.district).trim() : null,
        subdistrict: subdistrict || null,
        postal_code: postal || null,
        address: data.address ? String(data.address).trim() : null,
        ...(role === 'sitter'
          ? {
              petsitter: {
                create: {
                  thaiid: thaiId,
                  experience: data.experience ? String(data.experience).trim() : null,
                },
              },
            }
          : {
              petowner: {
                create: {},
              },
            }),
      },
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
      const targetStr = [
        Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : (error.meta?.target || ''),
        (error.meta as Record<string, unknown> | undefined)?.constraint || '',
        error.message || '',
      ].join(' ').toLowerCase()

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
