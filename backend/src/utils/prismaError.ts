/**
 * หาว่า unique constraint (P2002) ที่ชนคือคอลัมน์ไหน
 *
 * Prisma 7 ที่ใช้ driver adapter (@prisma/adapter-pg) **ไม่เซ็ต `meta.target`**
 * ชื่อ constraint จริงไปอยู่ที่ meta.driverAdapterError.cause.constraint.index แทน เช่น "USER_email_key"
 * ฟังก์ชันนี้อ่านให้ครบทุกที่แล้วคืนสตริงตัวพิมพ์เล็ก เอาไป .includes('email') ต่อได้เลย
 *
 * คืนสตริงว่างถ้าหาไม่เจอ
 */
export const getUniqueConstraintTarget = (error: unknown): string => {
  const meta = (error as { meta?: Record<string, unknown> })?.meta
  if (!meta) return ''

  // รูปแบบเดิม (Prisma engine ปกติ)
  const target = meta.target
  if (Array.isArray(target)) return target.join(' ').toLowerCase()
  if (typeof target === 'string') return target.toLowerCase()

  // รูปแบบของ driver adapter
  const cause = (meta.driverAdapterError as { cause?: Record<string, unknown> } | undefined)?.cause
  if (!cause) return ''

  const index = (cause.constraint as { index?: unknown } | undefined)?.index
  if (typeof index === 'string') return index.toLowerCase()

  // เผื่อไว้ท้ายสุด — ข้อความดิบจาก Postgres มีชื่อ constraint อยู่ในนั้น
  if (typeof cause.originalMessage === 'string') return cause.originalMessage.toLowerCase()

  return ''
}
