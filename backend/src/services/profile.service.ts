import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { UserProfileResponse, PetProfileResponse } from '../types/user.js'

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
    name: pet.name,
    species: pet.species ?? null,
    breed: pet.breed ?? null,
    gender: pet.gender ?? null,
    birthDate: pet.b_date
      ? (pet.b_date instanceof Date ? pet.b_date.toISOString().slice(0, 10) : String(pet.b_date).slice(0, 10))
      : null,
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
