import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { AppError } from '../utils/errors.js'
import { RegisterInput, UserRole } from '../types/user.js'

interface NewUserRow {
  userid: number
  username: string
  email: string
}

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

  // 2. เรียก Stored Function — 1 round trip แทน 4
  const tel = data.tel ? String(data.tel).trim() : null
  const province = data.province ? String(data.province).trim() : null
  const district = data.district ? String(data.district).trim() : null
  const address = data.address ? String(data.address).trim() : null
  const experience = data.experience ? String(data.experience).trim() : null

  try {
    const rows = await prisma.$queryRaw<NewUserRow[]>`
      SELECT * FROM register_user(
        ${username}, ${email}, ${hashedPassword},
        ${tel}, ${province}, ${district},
        ${subdistrict || null}, ${postal || null}, ${address},
        ${role}, ${thaiId || null}, ${experience}
      )
    `

    const newUser = rows[0]

    return {
      userId: newUser.userid,
      user: {
        id: newUser.userid,
        username: newUser.username,
        email: newUser.email,
        role,
      },
    }
  } catch (error: unknown) {
    // Prisma adapter wrap PG error ไว้ใน message แทนที่จะโยน code ตรงๆ
    // ต้องเช็คทั้ง raw PG code และ Prisma wrapped message
    const err = error as { code?: string; detail?: string; constraint?: string; message?: string }

    const isUniqueViolation =
      err?.code === '23505' ||
      err?.message?.includes('23505')

    if (isUniqueViolation) {
      const hint = [err.detail, err.constraint, err.message]
        .filter(Boolean).join(' ').toLowerCase()

      if (hint.includes('email')) {
        throw new AppError(409, 'EMAIL_DUPLICATE', 'Email already registered')
      }
      if (hint.includes('username')) {
        throw new AppError(409, 'USERNAME_DUPLICATE', 'Username already registered', [
          { field: 'username', message: 'Username already registered' },
        ])
      }
      if (hint.includes('thaiid')) {
        throw new AppError(409, 'THAI_ID_DUPLICATE', 'Thai ID already registered', [
          { field: 'thaiId', message: 'Thai ID already registered' },
        ])
      }

      throw new AppError(409, 'DUPLICATE_RESOURCE', 'A user with this credential already exists')
    }

    throw error
  }
}
