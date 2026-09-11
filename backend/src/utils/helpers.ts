
/**
 * ตรวจสอบว่าค่าเป็น null, undefined หรือเป็น String ว่างหรือไม่
 */
export const isEmpty = (val: unknown): boolean => {
  if (val === null || val === undefined) return true
  if (typeof val === 'string') return val.trim().length === 0
  return false
}

/**
 * แปลงค่าให้เป็น String ที่ผ่านการ trim แล้วอย่างปลอดภัย ป้องกัน TypeError จาก .trim()
 */
export const toCleanString = (val: unknown): string => {
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'number') return String(val).trim()
  return ''
}

/**
 * ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย 13 หลักด้วยสูตร Modulo 11
 */
export const isThaiIDValid = (id: string): boolean => {
  if (id.length !== 13 || !/^\d{13}$/.test(id)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i), 10) * (13 - i)
  }
  return (11 - (sum % 11)) % 10 === parseInt(id.charAt(12), 10)
}
