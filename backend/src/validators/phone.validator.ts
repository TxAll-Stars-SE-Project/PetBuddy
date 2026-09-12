import { parsePhoneNumber } from 'libphonenumber-js/max'

import { PhoneValidationResult } from '../types/user.js'

/**
 * ตรวจสอบความถูกต้องและจัดรูปแบบหมายเลขโทรศัพท์ของไทย
 * รองรับทั้งเบอร์มือถือ (06, 08, 09) และเบอร์บ้าน/สำนักงาน (02, 03x, 04x, 05x, 07x)
 * รวมถึงรูปแบบสากล (+66) พร้อม Normalize เป็นรูปแบบ National (เช่น 0812345678)
 */
export function validateAndNormalizeThaiPhone(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, error: 'กรุณากรอกเบอร์โทร' }
  }

  const cleaned = rawPhone.trim()
  if (!cleaned) {
    return { isValid: false, error: 'กรุณากรอกเบอร์โทร' }
  }

  try {
    const phoneNumber = parsePhoneNumber(cleaned, 'TH')

    if (!phoneNumber.isValid()) {
      return { isValid: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้องตามรูปแบบของไทย' }
    }

    const type = phoneNumber.getType()
    // ยอมรับทั้งเบอร์มือถือ (MOBILE) และเบอร์บ้าน/สำนักงาน (FIXED_LINE)
    if (type !== 'MOBILE' && type !== 'FIXED_LINE') {
      return { isValid: false, error: 'เบอร์โทรศัพท์ต้องเป็นเบอร์มือถือหรือเบอร์บ้านของไทย' }
    }

    // จัดรูปแบบให้เป็นเลข 9-10 หลักแบบ National (เช่น 0812345678 หรือ 021234567) ไม่มีช่องว่างหรือขีด
    const normalized = phoneNumber.formatNational().replace(/[\s-]/g, '')
    return { isValid: true, normalized }
  } catch {
    return { isValid: false, error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }
  }
}
