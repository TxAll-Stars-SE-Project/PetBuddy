/**
 * Thunder Solution Slip Verification Service (API v2)
 *
 * ทำหน้าที่เชื่อมต่อกับ Thunder Solution API (https://api.thunder.in.th/v2/verify/bank)
 * เพื่อตรวจสอบความถูกต้องของสลิปโอนเงินธนาคารไทย:
 * 1. ยอดเงินตรงกับยอดที่ต้องชำระ (Amount matching)
 * 2. ตรวจสอบการใช้สลิปซ้ำ (Duplicate detection)
 * 3. ตรวจสอบวันที่โอนเงิน (Transfer date validation)
 * 4. สกัดและตรวจสอบชื่อผู้ส่งและชื่อผู้รับ (Sender & Receiver names)
 */

export interface ThunderRawSlipSender {
  bank?: {
    id?: string
    name?: string
    nameTh?: string
    nameEn?: string
    code?: string
    shortCode?: string
    short?: string
  }
  name?:
    | string
    | {
        th?: string
        en?: string
      }
  displayName?: string
  account?: {
    name?: string | { th?: string; en?: string }
    bank?: { nameTh?: string; nameEn?: string; code?: string; account?: string }
    proxy?: { type?: string; value?: string; account?: string }
  }
}

export interface ThunderRawSlipReceiver {
  bank?: {
    id?: string
    name?: string
    nameTh?: string
    nameEn?: string
    code?: string
    shortCode?: string
    short?: string
  }
  name?:
    | string
    | {
        th?: string
        en?: string
      }
  displayName?: string
  account?: {
    name?: string | { th?: string; en?: string }
    bank?: { nameTh?: string; nameEn?: string; code?: string; account?: string }
    proxy?: { type?: string; value?: string; account?: string }
  }
  merchantId?: string | null
}

export interface ThunderRawSlipData {
  payload?: string
  transRef?: string
  date?: string
  amount?: {
    amount?: number
  }
  sender?: ThunderRawSlipSender
  receiver?: ThunderRawSlipReceiver
}

export interface ThunderApiResponseData {
  remark?: string
  isDuplicate?: boolean
  matchedAccount?: {
    bank?: { nameTh?: string; nameEn?: string; code?: string; shortCode?: string }
    nameTh?: string
    nameEn?: string
    type?: string
    bankNumber?: string
  }
  amountInOrder?: number
  amountInSlip?: number
  isAmountMatched?: boolean
  rawSlip?: ThunderRawSlipData
}

export interface ThunderApiResponse {
  success: boolean
  data?: ThunderApiResponseData
  message?: string
  error?: {
    code?: string
    message?: string
  }
}

export interface ThunderVerificationResult {
  isValid: boolean
  isDuplicate: boolean
  isFallback: boolean
  transRef?: string
  amount?: number
  transferDate?: Date
  senderName?: { th?: string; en?: string }
  receiverName?: { th?: string; en?: string }
  senderBank?: string
  receiverBank?: string
  errorReason?: string
  rawResponse?: ThunderApiResponseData
}

export interface VerifySlipOptions {
  apiKey?: string
  apiUrl?: string
  maxDaysOld?: number
  fetchFn?: typeof fetch
}

const DEFAULT_THUNDER_API_URL = 'https://api.thunder.in.th/v2/verify/bank'
const DEFAULT_MAX_DAYS_OLD = 3 // สลิปไม่ควรเก่าเกิน 3 วัน

/**
 * ฟังก์ชันหลักในการเรียก Thunder Solution API เพื่อตรวจสลิป
 */
export const verifySlipWithThunder = async (
  slipUrl: string,
  expectedAmount: number,
  options: VerifySlipOptions = {}
): Promise<ThunderVerificationResult> => {
  const apiKey = options.apiKey ?? process.env.THUNDER_API_KEY
  const apiUrl = options.apiUrl ?? process.env.THUNDER_API_URL ?? DEFAULT_THUNDER_API_URL
  const maxDaysOld = options.maxDaysOld ?? DEFAULT_MAX_DAYS_OLD
  const fetchClient = options.fetchFn ?? fetch

  // 1. ตรวจสอบว่ามีการตั้งค่า API Key หรือไม่ (หากไม่มี ให้ Fallback ไปยัง Manual Sitter Review)
  if (!apiKey || apiKey.trim() === '') {
    console.warn(
      '[ThunderSlipService] THUNDER_API_KEY is not configured. Falling back to manual verification.'
    )
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: true,
      errorReason: 'Thunder API key not configured',
    }
  }

  // 2. ส่ง Request ไปยัง Thunder Solution API
  let apiResponse: Response
  try {
    apiResponse = await fetchClient(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: slipUrl,
        matchAmount: expectedAmount,
        checkDuplicate: true,
      }),
    })
  } catch (err) {
    console.error('[ThunderSlipService] Network or connection error:', err)
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: true,
      errorReason: 'Thunder API unreachable, network error',
    }
  }

  // 3. ตรวจสอบกรณี Thunder API คืนค่า Error ด้าน Server (HTTP 5xx / 429)
  if (apiResponse.status >= 500 || apiResponse.status === 429) {
    console.error(`[ThunderSlipService] Upstream error: HTTP ${apiResponse.status}`)
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: true,
      errorReason: `Thunder API server error: HTTP ${apiResponse.status}`,
    }
  }

  // 4. แปลงข้อมูล JSON Response
  let responseBody: ThunderApiResponse
  try {
    responseBody = (await apiResponse.json()) as ThunderApiResponse
  } catch (err) {
    console.error('[ThunderSlipService] Failed to parse JSON response:', err)
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: true,
      errorReason: 'Thunder API returned invalid JSON',
    }
  }

  // 5. ตรวจสอบกรณี Thunder ระบุข้อผิดพลาด (เช่น ไม่พบ QR Code / ไม่ใช่สลิปธนาคาร)
  if (!responseBody.success || !responseBody.data) {
    let errorMsg =
      responseBody.error?.message ||
      responseBody.message ||
      'ไม่พบข้อมูลสลิป หรือรูปภาพไม่ใช่สลิปธนาคารที่ถูกต้อง'

    if (
      errorMsg.includes('payload string') ||
      errorMsg.includes('image file') ||
      errorMsg.includes('base64 encoded') ||
      errorMsg.includes('image URL') ||
      errorMsg.includes('VALIDATION_ERROR')
    ) {
      errorMsg = 'รูปภาพไม่ถูกต้อง หรือไม่พบ QR Code สลิปธนาคาร กรุณาแนบรูปสลิปใหม่อีกครั้ง'
    }

    return {
      isValid: false,
      isDuplicate: false,
      isFallback: false,
      errorReason: errorMsg,
    }
  }

  const { data } = responseBody

  // 6. ตรวจสอบสลิปซ้ำ (Duplicate Check)
  if (data.isDuplicate) {
    return {
      isValid: false,
      isDuplicate: true,
      isFallback: false,
      errorReason: 'สลิปนี้ถูกใช้งานไปแล้วในระบบ (สลิปซ้ำ)',
      rawResponse: data,
    }
  }

  // 7. ตรวจสอบยอดเงิน (Amount Match)
  const slipAmount =
    typeof data.amountInSlip === 'number'
      ? data.amountInSlip
      : data.rawSlip?.amount?.amount ?? 0

  const isAmountMatched =
    data.isAmountMatched === true ||
    Math.abs(slipAmount - expectedAmount) < 0.01

  if (!isAmountMatched) {
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: false,
      amount: slipAmount,
      errorReason: `ยอดเงินในสลิป (฿${slipAmount.toLocaleString('th-TH')}) ไม่ตรงกับยอดที่ต้องชำระ (฿${expectedAmount.toLocaleString('th-TH')})`,
      rawResponse: data,
    }
  }

  // 8. ตรวจสอบวันที่โอนเงิน (Transfer Date)
  const rawDateStr = data.rawSlip?.date
  let transferDate: Date | undefined
  if (rawDateStr) {
    const parsed = new Date(rawDateStr)
    if (!isNaN(parsed.getTime())) {
      transferDate = parsed
    }
  }

  if (transferDate) {
    const now = new Date()
    // ป้องกันสลิปเวลาในอนาคต (ยอมรับ clock skew เล็กน้อย 5 นาที)
    if (transferDate.getTime() > now.getTime() + 5 * 60 * 1000) {
      return {
        isValid: false,
        isDuplicate: false,
        isFallback: false,
        transferDate,
        errorReason: 'เวลาทำรายการในสลิปไม่ถูกต้อง (เวลาในอนาคต)',
        rawResponse: data,
      }
    }

    // ป้องกันสลิปเก่าเกินกำหนด
    const maxAgeMs = maxDaysOld * 24 * 60 * 60 * 1000
    if (now.getTime() - transferDate.getTime() > maxAgeMs) {
      return {
        isValid: false,
        isDuplicate: false,
        isFallback: false,
        transferDate,
        errorReason: `สลิปการโอนหมดอายุ (เกิน ${maxDaysOld} วัน)`,
        rawResponse: data,
      }
    }
  }

  // 9. สกัดและตรวจสอบชื่อผู้ส่งและชื่อผู้รับ (Sender & Receiver)
  const extractPartyName = (
    party?: ThunderRawSlipSender | ThunderRawSlipReceiver,
    fallbackTh?: string,
    fallbackEn?: string
  ) => {
    let th: string | undefined
    let en: string | undefined

    // 1) โครงสร้างมาตรฐาน Thunder API v2: party.account.name
    if (party?.account?.name) {
      if (typeof party.account.name === 'object') {
        th = party.account.name.th?.trim() || undefined
        en = party.account.name.en?.trim() || undefined
      } else if (typeof party.account.name === 'string') {
        th = party.account.name.trim() || undefined
      }
    }

    // 2) โครงสร้าง party.name
    if (!th && !en && party?.name) {
      if (typeof party.name === 'object') {
        th = party.name.th?.trim() || undefined
        en = party.name.en?.trim() || undefined
      } else if (typeof party.name === 'string') {
        th = party.name.trim() || undefined
      }
    }

    // 3) โครงสร้าง party.displayName
    if (!th && !en && party?.displayName) {
      th = party.displayName.trim() || undefined
    }

    // 4) Fallback จาก matchedAccount
    if (!th && fallbackTh) {
      th = fallbackTh.trim() || undefined
    }
    if (!en && fallbackEn) {
      en = fallbackEn.trim() || undefined
    }

    return { th, en }
  }

  const senderName = extractPartyName(data.rawSlip?.sender)
  const receiverName = extractPartyName(
    data.rawSlip?.receiver,
    data.matchedAccount?.nameTh,
    data.matchedAccount?.nameEn
  )

  const hasSenderName = Boolean(senderName.th || senderName.en)
  const hasReceiverName = Boolean(receiverName.th || receiverName.en)

  if (!hasSenderName && !hasReceiverName) {
    return {
      isValid: false,
      isDuplicate: false,
      isFallback: false,
      errorReason: 'ไม่พบข้อมูลชื่อผู้รับหรือผู้โอนเงินในสลิป',
      rawResponse: data,
    }
  }

  // 10. สลิปผ่านการตรวจสอบทุกเงื่อนไข (Valid 100%)
  const senderBank =
    data.rawSlip?.sender?.bank?.nameTh ||
    data.rawSlip?.sender?.bank?.name ||
    data.rawSlip?.sender?.bank?.nameEn ||
    data.rawSlip?.sender?.bank?.shortCode ||
    data.rawSlip?.sender?.bank?.short
  const receiverBank =
    data.rawSlip?.receiver?.bank?.nameTh ||
    data.rawSlip?.receiver?.bank?.name ||
    data.rawSlip?.receiver?.bank?.nameEn ||
    data.rawSlip?.receiver?.bank?.shortCode ||
    data.rawSlip?.receiver?.bank?.short ||
    data.matchedAccount?.bank?.nameTh ||
    data.matchedAccount?.bank?.nameEn ||
    data.matchedAccount?.bank?.shortCode

  return {
    isValid: true,
    isDuplicate: false,
    isFallback: false,
    transRef: data.rawSlip?.transRef,
    amount: slipAmount,
    transferDate,
    senderName,
    receiverName,
    senderBank,
    receiverBank,
    rawResponse: data,
  }
}
