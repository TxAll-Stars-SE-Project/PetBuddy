import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { payment_status } from '../generated/prisma/enums.js'

/**
 * สัดส่วนเงินมัดจำ 30% ของยอดรวม (US6-1)
 */
export const DEPOSIT_RATE = 0.3

/**
 * สถานะการชำระเงินที่ถือว่า "จ่ายแล้วจริง" และนำมาหักออกจากยอดคงเหลือ
 *
 * อ้างอิง sprint2_UML — PaymentModal critical flow:
 *   "backend เอา total ลบด้วย payment ที่แนบจ่ายไปแล้ว (have verified)"
 *
 * สลิปที่ยังรอตรวจ (pending_verifying) จึงยังไม่ถูกหัก เพราะพี่เลี้ยงอาจปฏิเสธภายหลัง
 * ถ้าทีมตกลงกันใหม่ว่าให้นับสลิปที่รอตรวจด้วย ให้แก้ที่ค่านี้ที่เดียว
 */
const PAID_STATUSES: payment_status[] = ['verified']

/**
 * รูปแบบข้อมูลสรุปยอดชำระเงิน (docs/API.md § 3.1)
 */
export interface PaymentSummaryResponse {
  bookingId: number
  bookingstatus: string
  totalPrice: number
  paymentplan: string | null
  depositAmount: number
  remainingAmount: number
  payments: {
    paymentId: number
    amount: number
    payment_stage: string
    payment_status: string
    paid_at: string
  }[]
}

/**
 * ปัดเศษเงินให้เหลือทศนิยม 2 ตำแหน่งโดยคำนวณผ่านหน่วยสตางค์
 * ป้องกันความคลาดเคลื่อนของ floating point เช่น 6300 * 0.3 = 1890.0000000000002
 */
const toMoney = (amount: number): number => Math.round(amount * 100) / 100

/**
 * สรุปยอดที่ต้องชำระของการจองหนึ่งรายการ
 *
 * สิทธิ์เข้าถึง: เจ้าของสัตว์เลี้ยงหรือพี่เลี้ยงของการจองนั้นเท่านั้น
 * (API.md § 3.1 ไม่จำกัด role จึงต้องเช็คความเป็นคู่สัญญาที่ระดับข้อมูลแทน)
 */
export const getPaymentSummary = async (
  userId: number,
  bookingId: number
): Promise<PaymentSummaryResponse> => {
  const booking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    include: {
      payment: {
        orderBy: { paid_at: 'asc' },
      },
    },
  })

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  const isParticipant = booking.ownerid === userId || booking.sitterid === userId
  if (!isParticipant) {
    throw new AppError(403, 'NOT_BOOKING_PARTICIPANT', 'Not a participant of this booking')
  }

  const totalPrice = Number(booking.totalprice)

  // ยอดที่ชำระและผ่านการตรวจสอบแล้ว ใช้หักออกจากยอดรวมเพื่อหา "ยอดคงเหลือ"
  const paidAmount = booking.payment
    .filter((p) => PAID_STATUSES.includes(p.payment_status))
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    bookingId: booking.bookingid,
    bookingstatus: booking.bookingstatus,
    totalPrice: toMoney(totalPrice),
    paymentplan: booking.paymentplan,
    depositAmount: toMoney(totalPrice * DEPOSIT_RATE),
    // ไม่ให้ติดลบ เผื่อกรณีมีสลิปเกินยอดถูก verify เข้ามา
    remainingAmount: Math.max(toMoney(totalPrice - paidAmount), 0),
    payments: booking.payment.map((p) => ({
      paymentId: p.paymentid,
      amount: Number(p.amount),
      payment_stage: p.payment_stage,
      payment_status: p.payment_status,
      paid_at: p.paid_at.toISOString(),
    })),
  }
}
