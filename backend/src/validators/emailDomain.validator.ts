import dns from 'node:dns/promises'
import { EmailDomainValidationResult } from '../types/user.js'
const POPULAR_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yahoo.co.th',
  'icloud.com',
  'live.com',
  'msn.com',
  'windowslive.com',
  'chula.ac.th',
  'ku.ac.th',
  'tu.ac.th',
  'cmu.ac.th',
  'kmitl.ac.th',
  'kmutt.ac.th',
  'psu.ac.th',
  'mahidol.ac.th',
  'bu.ac.th',
  'swu.ac.th',
  'au.edu',
  'apple.com',
  'google.com',
  'microsoft.com',
])

// -------------------------------------------------------------
// 2. In-Memory DNS Cache (เก็บผลลัพธ์การเช็คโดเมน 24 ชั่วโมง)
// โดเมนอื่นๆ ที่เช็คผ่าน DNS ไปแล้ว จะถูกจำไว้ใน Cache ไม่ต้องยิงถามซ้ำ
// -------------------------------------------------------------
interface CacheEntry {
  isValid: boolean
  expiresAt: number
}

const domainCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 ชั่วโมง

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`DNS lookup timed out after ${ms}ms`)
      ;(err as unknown as { code: string }).code = 'ETIMEOUT'
      reject(err)
    }, ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

/**
 * ตรวจสอบความถูกต้องของรูปแบบอีเมลและความมีอยู่จริงของ Mail Server สำหรับ Domain นั้นๆ
 */
export async function validateEmailDomain(email: string): Promise<EmailDomainValidationResult> {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'กรุณากรอกอีเมล' }
  }

  const parts = email.split('@')
  if (parts.length !== 2) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  const domain = parts[1].trim().toLowerCase()
  if (!domain) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  // 1. ตรวจสอบรูปแบบโครงสร้าง Domain (FQDN syntax)
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'รูปแบบโดเมนของอีเมลไม่ถูกต้อง' }
  }

  // 2. TLD ต้องมีอย่างน้อย 2 ตัวอักษรและเป็นตัวอักษรภาษาอังกฤษ
  const tld = domain.split('.').pop()
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'โดเมนของอีเมลต้องลงท้ายด้วย TLD ที่ถูกต้อง' }
  }

  // 3. เช็คโดเมนยอดฮิต (Fast Path: 0 ms)
  if (POPULAR_DOMAINS.has(domain)) {
    return { isValid: true }
  }

  // 4. ในกรณีที่เป็นโดเมนทดสอบในระบบเทส
  if (domain.endsWith('.test') || domain.endsWith('.example')) {
    return { isValid: true }
  }

  // 5. เช็คจาก Cache
  const cached = domainCache.get(domain)
  if (cached && Date.now() < cached.expiresAt) {
    if (cached.isValid) {
      return { isValid: true }
    } else {
      return {
        isValid: false,
        error: 'โดเมนของอีเมลไม่สามารถใช้งานได้หรือไม่พบเซิร์ฟเวอร์รับอีเมล',
      }
    }
  }

  // 6. ตรวจสอบ DNS Records (MX records และ Fallback A record)
  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), 2500)
    if (mxRecords && mxRecords.length > 0) {
      domainCache.set(domain, { isValid: true, expiresAt: Date.now() + CACHE_TTL_MS })
      return { isValid: true }
    }
  } catch (err: unknown) {
    const dnsError = err as { code?: string; name?: string; message?: string }
    if (dnsError?.code === 'ENOTFOUND' || dnsError?.code === 'ENODATA') {
      // RFC 5321: หากไม่พบ MX record ให้ตรวจสอบว่ามี A record หรือไม่
      try {
        const aRecords = await withTimeout(dns.resolve4(domain), 1500)
        if (aRecords && aRecords.length > 0) {
          domainCache.set(domain, { isValid: true, expiresAt: Date.now() + CACHE_TTL_MS })
          return { isValid: true }
        }
      } catch (aErr: unknown) {
        const aDnsError = aErr as { code?: string }
        if (aDnsError?.code === 'ENOTFOUND' || aDnsError?.code === 'ENODATA') {
          domainCache.set(domain, { isValid: false, expiresAt: Date.now() + CACHE_TTL_MS })
          return {
            isValid: false,
            error: 'โดเมนของอีเมลไม่สามารถใช้งานได้หรือไม่พบเซิร์ฟเวอร์รับอีเมล',
          }
        }
      }
    } else if (
      dnsError?.code === 'ETIMEOUT' ||
      dnsError?.code === 'ECONNREFUSED' ||
      dnsError?.code === 'SERVFAIL'
    ) {
      // Fail-open: ในกรณี DNS timeout หรือมีปัญหา Network ชั่วคราว ปล่อยให้ผ่านพร้อม log เตือน
      console.warn(`[validateEmailDomain] DNS lookup warning for ${domain}:`, dnsError.message)
      return { isValid: true }
    }
  }

  return { isValid: true }
}
