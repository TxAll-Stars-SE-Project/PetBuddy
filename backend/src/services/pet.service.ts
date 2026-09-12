import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreatePetInput, PetResponse } from '../types/pet.js'

export const deletePet = async (petId: number, ownerId: number): Promise<void> => {
  // 1. หา pet ที่จะลบ
  const pet = await prisma.pet.findUnique({
    where: { petid: petId },
  })

  if (!pet) {
    throw new AppError(404, 'PET_NOT_FOUND', 'Pet not found')
  }

  // 2. ลบได้เฉพาะ pet ของตัวเองเท่านั้น
  if (pet.ownerid !== ownerId) {
    throw new AppError(403, 'FORBIDDEN', 'Pet does not belong to the requesting owner')
  }

  // TODO: docs/API.md กำหนดให้ตอบ 409 ถ้า pet ติด booking ที่ยัง active/pending อยู่
  // แต่ตาราง booking ยังไม่มีคอลัมน์เชื่อมไปหา pet จึงยังเช็คไม่ได้
  // ต้องรอให้ความสัมพันธ์ pet <-> booking ถูกเพิ่มเข้า schema ก่อน

  // 3. ลบจริง
  await prisma.pet.delete({
    where: { petid: petId },
  })
}

export const createPet = async (
  ownerId: number,
  data: CreatePetInput
): Promise<PetResponse> => {
  // Ensure the petowner row exists for foreign key constraint
  const ownerExists = await prisma.petowner.findUnique({
    where: { userid: ownerId },
  })

  if (!ownerExists) {
    // Check if user exists to create the petowner row
    const user = await prisma.uSER.findUnique({
      where: { userid: ownerId },
    })

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'ไม่พบข้อมูลผู้ใช้นี้ในระบบ')
    }

    await prisma.petowner.create({
      data: { userid: ownerId },
    })
  }

  try {
    const newPet = await prisma.pet.create({
      data: {
        ownerid: ownerId,
        name: data.name,
        b_date: data.b_date,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        weight: data.weight !== null && data.weight !== undefined ? data.weight : null,
        allergy: data.allergy || data.notes,
        image_url: data.image_url || data.photo,
      },
    })

    // Compute age for response if b_date is available
    let calculatedAge: number | null = data.age ?? null
    if (newPet.b_date && calculatedAge === null) {
      const now = new Date()
      const birth = new Date(newPet.b_date)
      let years = now.getFullYear() - birth.getFullYear()
      const monthDiff = now.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        years--
      }
      calculatedAge = Math.max(0, years)
    }

    return {
      id: String(newPet.petid),
      petid: newPet.petid,
      ownerId: String(newPet.ownerid),
      ownerid: newPet.ownerid,
      name: newPet.name,
      species: newPet.species,
      breed: newPet.breed,
      age: calculatedAge,
      b_date: newPet.b_date ? newPet.b_date.toISOString().split('T')[0] : null,
      gender: newPet.gender,
      weight: newPet.weight ? Number(newPet.weight) : null,
      notes: newPet.allergy,
      allergy: newPet.allergy,
      photo: newPet.image_url,
      image_url: newPet.image_url,
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }

    const isUniqueViolation =
      err?.code === 'P2002' ||
      err?.code === '23505' ||
      err?.message?.includes('23505') ||
      err?.message?.includes('pet_ownerid_name_unique')

    if (isUniqueViolation) {
      throw new AppError(
        409,
        'PET_NAME_DUPLICATE',
        'คุณมีสัตว์เลี้ยงชื่อนี้ในระบบแล้ว กรุณาใช้ชื่ออื่น'
      )
    }

    throw error
  }
}

