import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import * as storage from '../utils/supabase/storage.js'

export interface SitterPaymentInfoResponse {
  sitterId: number
  accountName: string | null
  qrCodeUrl: string | null
  hasPaymentInfo: boolean
}

// Allows test suites to intercept storage calls without ESM module namespace freezes
export const storageHooks = {
  uploadQrCodeImage: (file: Express.Multer.File, sitterId: number) =>
    storage.uploadQrCodeImage(file, sitterId),
  deleteQrCodeImage: (url: string) => storage.deleteQrCodeImage(url),
}

export const getPaymentInfo = async (sitterId: number): Promise<SitterPaymentInfoResponse> => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    select: { userid: true, account_name: true, qr_code_url: true },
  })

  if (!sitter) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'ไม่พบข้อมูลพี่เลี้ยง')
  }

  const hasPaymentInfo = Boolean(sitter.account_name && sitter.qr_code_url)

  return {
    sitterId: sitter.userid,
    accountName: sitter.account_name ?? null,
    qrCodeUrl: sitter.qr_code_url ?? null,
    hasPaymentInfo,
  }
}

export const savePaymentInfo = async (
  sitterId: number,
  input: { accountName?: string; file?: Express.Multer.File }
): Promise<{ accountName: string | null; qrCodeUrl: string | null }> => {
  // 1. Check sitter existence FIRST before uploading to Supabase
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    select: { userid: true, account_name: true, qr_code_url: true },
  })

  if (!sitter) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'ไม่พบข้อมูลพี่เลี้ยง')
  }

  const oldQrCodeUrl = sitter.qr_code_url
  let uploadedQrUrl: string | undefined

  // 2. Upload new QR code only after sitter is confirmed to exist
  if (input.file) {
    uploadedQrUrl = await storageHooks.uploadQrCodeImage(input.file, sitterId)
  }

  try {
    const updated = await prisma.petsitter.update({
      where: { userid: sitterId },
      data: {
        ...(input.accountName !== undefined && { account_name: input.accountName }),
        ...(uploadedQrUrl !== undefined && { qr_code_url: uploadedQrUrl }),
      },
      select: { account_name: true, qr_code_url: true },
    })

    // 3. Delete previous QR code from storage if replaced
    if (uploadedQrUrl && oldQrCodeUrl && oldQrCodeUrl !== uploadedQrUrl) {
      await storageHooks.deleteQrCodeImage(oldQrCodeUrl)
    }

    return {
      accountName: updated.account_name ?? null,
      qrCodeUrl: updated.qr_code_url ?? null,
    }
  } catch (error) {
    // Rollback: delete uploaded file if database update fails
    if (uploadedQrUrl) {
      await storageHooks.deleteQrCodeImage(uploadedQrUrl).catch((err) =>
        console.error('Failed to rollback uploaded QR code:', err)
      )
    }
    throw error
  }
}

export const deletePaymentInfo = async (
  sitterId: number
): Promise<{ accountName: null; qrCodeUrl: null; hasPaymentInfo: false }> => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    select: { userid: true, qr_code_url: true },
  })

  if (!sitter) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'ไม่พบข้อมูลพี่เลี้ยง')
  }

  const oldQrCodeUrl = sitter.qr_code_url

  await prisma.petsitter.update({
    where: { userid: sitterId },
    data: {
      account_name: null,
      qr_code_url: null,
    },
  })

  if (oldQrCodeUrl) {
    await storageHooks.deleteQrCodeImage(oldQrCodeUrl).catch((err) =>
      console.warn(`[Supabase Storage] Could not delete QR code for sitter ${sitterId}:`, err)
    )
  }

  return {
    accountName: null,
    qrCodeUrl: null,
    hasPaymentInfo: false,
  }
}
