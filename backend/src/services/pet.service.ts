import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'

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
