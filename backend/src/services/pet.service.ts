import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { calculateAge } from '../utils/helpers.js'
import { deletePetImage } from '../utils/supabase/index.js'
import { CreatePetInput, UpdatePetInput, PetResponse } from '../types/pet.js'

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

  // 3. ลบจริงในฐานข้อมูล
  await prisma.pet.delete({
    where: { petid: petId },
  })

  // 4. ลบไฟล์รูปภาพใน Supabase Storage (ถ้ามี) เพื่อป้องกัน Orphaned file
  if (pet.image_url) {
    await deletePetImage(pet.image_url).catch((err) =>
      console.warn(`[Supabase Storage] Could not delete image for pet ${petId}:`, err)
    )
  }
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

    const calculatedAge = data.age ?? calculateAge(newPet.b_date)

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

export const updatePet = async (
  petId: number,
  ownerId: number,
  data: UpdatePetInput
): Promise<PetResponse> => {
  // 1. ตรวจสอบว่าสัตว์เลี้ยงมีอยู่จริงหรือไม่
  const pet = await prisma.pet.findUnique({
    where: { petid: petId },
  })

  if (!pet) {
    throw new AppError(404, 'PET_NOT_FOUND', 'ไม่พบสัตว์เลี้ยงในระบบ')
  }

  // 2. ตรวจสอบความเป็นเจ้าของ
  if (pet.ownerid !== ownerId) {
    throw new AppError(403, 'FORBIDDEN', 'คุณไม่มีสิทธิ์แก้ไขข้อมูลสัตว์เลี้ยงตัวนี้')
  }

  // 3. ถ้ามีการเปลี่ยนชื่อ ตรวจสอบว่าชื่อใหม่ซ้ำกับสัตว์เลี้ยงตัวอื่นของตนเองหรือไม่
  if (data.name && data.name.trim().toLowerCase() !== pet.name.trim().toLowerCase()) {
    const duplicate = await prisma.pet.findFirst({
      where: {
        ownerid: ownerId,
        name: data.name.trim(),
        NOT: { petid: petId },
      },
    })

    if (duplicate) {
      throw new AppError(
        409,
        'PET_NAME_DUPLICATE',
        'คุณมีสัตว์เลี้ยงชื่อนี้ในระบบแล้ว กรุณาใช้ชื่ออื่น'
      )
    }
  }

  // เก็บ oldImageUrl ไว้ เพื่อลบหลังจากอัปเดต DB สำเร็จ
  const oldImageUrl = pet.image_url
  const isImageUpdated = data.image_url !== undefined && data.image_url !== oldImageUrl

  // 4. อัปเดตข้อมูลลง Database (Prisma จะละเว้นฟิลด์ที่เป็น undefined ให้อัตโนมัติ)
  try {
    const updatedPet = await prisma.pet.update({
      where: { petid: petId },
      data: {
        name: data.name,
        species: data.species,
        breed: data.breed,
        b_date: data.b_date,
        gender: data.gender,
        weight: data.weight,
        allergy: data.allergy,
        image_url: data.image_url,
      },
    })

    // 5. ถ้าอัปเดตรูปภาพใหม่สำเร็จ และเดิมมีรูปภาพเก่าอยู่ ให้ลบรูปภาพเก่าออกจาก Supabase Storage ทันที
    if (isImageUpdated && oldImageUrl) {
      await deletePetImage(oldImageUrl).catch((err) =>
        console.warn(`[Supabase Storage] Failed to delete old image ${oldImageUrl}:`, err)
      )
    }

    const calculatedAge = data.age !== undefined ? data.age : calculateAge(updatedPet.b_date)

    return {
      id: String(updatedPet.petid),
      petid: updatedPet.petid,
      ownerId: String(updatedPet.ownerid),
      ownerid: updatedPet.ownerid,
      name: updatedPet.name,
      species: updatedPet.species,
      breed: updatedPet.breed,
      age: calculatedAge,
      b_date: updatedPet.b_date ? updatedPet.b_date.toISOString().split('T')[0] : null,
      gender: updatedPet.gender,
      weight: updatedPet.weight ? Number(updatedPet.weight) : null,
      notes: updatedPet.allergy,
      allergy: updatedPet.allergy,
      photo: updatedPet.image_url,
      image_url: updatedPet.image_url,
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


