import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { AppError } from '../utils/errors.js'
import { RegisterInput } from '../validators/auth.validator.js'

export const registerUser = async (data: RegisterInput) => {
  const username = (data.username || data.name || '').trim()
  const email = (data.email || '').trim().toLowerCase()
  const thaiId = (data.thaiId || data.thaiid || '').trim()
  const postal = (data.postalCode || data.postal_code || '').trim()
  const role = data.role as 'owner' | 'sitter'
  const password = data.password!

  // 1. ตรวจสอบข้อมูลซ้ำ
  const existingEmail = await prisma.uSER.findUnique({
    where: { email },
  })
  if (existingEmail) {
    throw new AppError(409, 'EMAIL_DUPLICATE', 'Email already registered')
  }

  const existingUsername = await prisma.uSER.findUnique({
    where: { username },
  })
  if (existingUsername) {
    throw new AppError(409, 'USERNAME_DUPLICATE', 'Username already registered', [
      { field: 'username', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
    ])
  }

  if (role === 'sitter') {
    const existingThaiId = await prisma.petsitter.findUnique({
      where: { thaiid: thaiId },
    })
    if (existingThaiId) {
      throw new AppError(409, 'THAI_ID_DUPLICATE', 'Thai ID already registered', [
        { field: 'thaiId', message: 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว' },
      ])
    }
  }

  // 2. Hash Password
  const hashedPassword = await hashPassword(password)

  // 3. บันทึกลงฐานข้อมูลด้วย Transaction
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
}
