import { AppError } from '../utils/errors.js'

export interface CreatePaymentInfoInput {
  accountName: string
  file: Express.Multer.File
}

export interface UpdatePaymentInfoInput {
  accountName?: string
  file?: Express.Multer.File
}

export const validateCreatePaymentInfoInput = (
  body: Record<string, unknown> = {},
  file?: Express.Multer.File
): CreatePaymentInfoInput => {
  const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : ''

  if (!accountName) {
    throw new AppError(400, 'MISSING_ACCOUNT_NAME', 'กรุณาระบุชื่อบัญชี')
  }

  if (accountName.length > 100) {
    throw new AppError(400, 'ACCOUNT_NAME_TOO_LONG', 'ชื่อบัญชีต้องมีความยาวไม่เกิน 100 ตัวอักษร')
  }

  if (!file) {
    throw new AppError(400, 'MISSING_QR_CODE', 'กรุณาอัปโหลดรูปภาพ QR Code')
  }

  return { accountName, file }
}

export const validateUpdatePaymentInfoInput = (
  body: Record<string, unknown> = {},
  file?: Express.Multer.File
): UpdatePaymentInfoInput => {
  const hasAccountName = body.accountName !== undefined && body.accountName !== null

  let accountName: string | undefined = undefined
  if (hasAccountName) {
    if (typeof body.accountName !== 'string' || body.accountName.trim() === '') {
      throw new AppError(400, 'INVALID_ACCOUNT_NAME', 'ชื่อบัญชีต้องไม่เป็นค่าว่าง')
    }
    const trimmed = body.accountName.trim()
    if (trimmed.length > 100) {
      throw new AppError(400, 'ACCOUNT_NAME_TOO_LONG', 'ชื่อบัญชีต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    }
    accountName = trimmed
  }

  if (!hasAccountName && !file) {
    throw new AppError(400, 'NO_DATA_TO_UPDATE', 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ')
  }

  return { accountName, file }
}
