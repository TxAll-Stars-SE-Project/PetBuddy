import { Prisma } from '../generated/prisma/client.js'
import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { getUniqueConstraintTarget } from '../utils/prismaError.js'
import { calculateAge } from '../utils/helpers.js'
import { UserProfileResponse, PetProfileResponse } from '../types/user.js'
import type { UpdateProfileInput } from '../validators/profile.validator.js'

export const getUserProfile = async (userId: number): Promise<UserProfileResponse> => {
  const user = await prisma.uSER.findUnique({
    where: { userid: userId },
    include: {
      petowner: {
        include: {
          pet: true,
        },
      },
      petsitter: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'ไม่พบผู้ใช้ในระบบ')
  }

  const baseProfile = {
    userId: user.userid,
    username: user.username,
    email: user.email,
    tel: user.tel ?? null,
    province: user.province ?? null,
    district: user.district ?? null,
    subdistrict: user.subdistrict ?? null,
    postalCode: user.postal_code ?? null,
    address: user.address ?? null,
  }

  if (user.petsitter) {
    return {
      ...baseProfile,
      role: 'sitter',
      thaiId: user.petsitter.thaiid ?? null,
      experience: user.petsitter.experience ?? null,
    }
  }

  const pets: PetProfileResponse[] = (user.petowner?.pet ?? []).map((pet) => ({
    petid: pet.petid,
    name: pet.name,
    species: pet.species ?? null,
    breed: pet.breed ?? null,
    gender: pet.gender ?? null,
    birthDate: pet.b_date
      ? (pet.b_date instanceof Date ? pet.b_date.toISOString().slice(0, 10) : String(pet.b_date).slice(0, 10))
      : null,
    age: calculateAge(pet.b_date),
    weight: pet.weight !== null && pet.weight !== undefined ? Number(pet.weight) : null,
    allergy: pet.allergy ?? null,
    imageUrl: pet.image_url ?? null,
  }))

  return {
    ...baseProfile,
    role: 'owner',
    pets,
  }
}

/**
 * แก้ข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (US2-2)
 *
 * userId มาจาก token เท่านั้น — ผู้เรียกแก้บัญชีคนอื่นไม่ได้
 * คืนค่าด้วย getUserProfile() เพื่อให้ response หน้าตาเหมือน GET /api/users/me เป๊ะ
 */
export const updateUserProfile = async (
  userId: number,
  data: UpdateProfileInput
): Promise<UserProfileResponse> => {
  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'NO_FIELDS_PROVIDED', 'ไม่มีข้อมูลที่ต้องการแก้ไข')
  }

  try {
    await prisma.uSER.update({
      where: { userid: userId },
      data,
      select: { userid: true },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = getUniqueConstraintTarget(error)

        if (target.includes('email')) {
          throw new AppError(409, 'EMAIL_DUPLICATE', 'อีเมลนี้ถูกใช้งานแล้ว', [
            { field: 'email', message: 'อีเมลนี้ถูกใช้งานแล้ว' },
          ])
        }
        if (target.includes('username')) {
          throw new AppError(409, 'USERNAME_DUPLICATE', 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', [
            { field: 'username', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
          ])
        }

        throw new AppError(409, 'DUPLICATE_RESOURCE', 'ข้อมูลนี้ถูกใช้งานแล้ว')
      }

      // token ยังไม่หมดอายุแต่บัญชีถูกลบไปแล้ว
      if (error.code === 'P2025') {
        throw new AppError(404, 'USER_NOT_FOUND', 'ไม่พบผู้ใช้ในระบบ')
      }
    }

    throw error
  }

  return getUserProfile(userId)
}
