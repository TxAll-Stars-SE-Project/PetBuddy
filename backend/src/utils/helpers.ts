

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

/**
 * คำนวณอายุ (ปี) จากวันเกิด (Date หรือ String ISO)
 */
export const calculateAge = (bDate: Date | string | null | undefined): number | null => {
  if (!bDate) return null
  const birth = bDate instanceof Date ? bDate : new Date(bDate)
  if (isNaN(birth.getTime())) return null

  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--
  }
  return Math.max(0, years)
}

/**
 * คำนวณวันเกิดคร่าวๆ จากอายุ (ปี)
 */
export const calculateBirthDateFromAge = (age: number): Date => {
  const approxDate = new Date()
  approxDate.setMonth(approxDate.getMonth() - Math.round(age * 12))
  return approxDate
}
