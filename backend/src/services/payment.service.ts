import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { booking_status, payment_stage, payment_status } from '../generated/prisma/enums.js'
import { SubmitPaymentDTO, VerifyPaymentAction } from '../validators/payment.validator.js'
import { uploadSlipImage } from '../utils/supabase/storage.js'
import { sendPaymentStatusNotificationEmail } from './mail.service.js'

export interface PaymentItemResponse {
  paymentId: number
  amount: number
  payment_stage: payment_stage
  payment_status: payment_status
  slip_image: string | null
  paid_at: string
}

export interface PaymentSummaryResponse {
  bookingId: number
  bookingstatus: string
  totalPrice: number
  paymentplan: string | null
  depositAmount: number
  remainingAmount: number
  payments: PaymentItemResponse[]
}

export interface PaymentSubmitResponse {
  paymentId: number
  payment_status: payment_status
  slip_image: string | null
}

export interface PaymentVerifyResponse {
  paymentId: number
  payment_status: payment_status
  bookingstatus: string
}

/**
 * ดึงสรุปยอดการชำระเงินและประวัติสลิปทั้งหมดของการจอง (Owner หรือ Sitter ของ booking เท่านั้น)
 */
export const getPaymentSummary = async (
  userId: number,
  bookingId: number
): Promise<PaymentSummaryResponse> => {
  const existingBooking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    include: {
      payment: {
        orderBy: { paid_at: 'asc' },
      },
      petowner: {
        select: { userid: true },
      },
      petsitter: {
        select: { userid: true },
      },
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  // ตรวจสอบสิทธิ์ว่าต้องเป็นคู่สัญญาของการจองนี้ (Owner หรือ Sitter)
  const isOwner = existingBooking.ownerid === userId
  const isSitter = existingBooking.sitterid === userId
  if (!isOwner && !isSitter) {
    throw new AppError(403, 'FORBIDDEN', 'Not a participant of this booking')
  }

  const totalPrice = Number(existingBooking.totalprice)
  const isDepositPlan = existingBooking.paymentplan === 'deposit'
  const depositAmount = isDepositPlan ? Math.round(totalPrice * 0.3) : totalPrice

  const verifiedPaidSoFar = existingBooking.payment
    .filter((p) => p.payment_status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const remainingAmount = Math.max(0, totalPrice - verifiedPaidSoFar)

  const formattedPayments: PaymentItemResponse[] = existingBooking.payment.map((p) => ({
    paymentId: p.paymentid,
    amount: Number(p.amount),
    payment_stage: p.payment_stage,
    payment_status: p.payment_status,
    slip_image: p.slip_image,
    paid_at: p.paid_at.toISOString(),
  }))

  return {
    bookingId: existingBooking.bookingid,
    bookingstatus: existingBooking.bookingstatus,
    totalPrice,
    paymentplan: existingBooking.paymentplan,
    depositAmount,
    remainingAmount,
    payments: formattedPayments,
  }
}

/**
 * อัปโหลดสลิปการโอนเงินขึ้น Cloud Storage และบันทึกลงฐานข้อมูล
 */
export const submitPaymentSlip = async (
  ownerUserId: number,
  input: SubmitPaymentDTO,
  file: Express.Multer.File
): Promise<PaymentSubmitResponse> => {
  const existingBooking = await prisma.booking.findUnique({
    where: { bookingid: input.bookingId },
    include: {
      payment: true,
      petowner: true,
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  // ตรวจสอบสิทธิ์ว่าต้องเป็นเจ้าของสัตว์เลี้ยงของ booking นี้
  if (existingBooking.ownerid !== ownerUserId) {
    throw new AppError(403, 'FORBIDDEN', 'Only pet owner can submit payment for this booking')
  }

  // ตรวจสอบสถานะการจองตามรอบการชำระเงิน
  if (input.payment_stage === 'deposit' || input.payment_stage === 'full') {
    if (existingBooking.bookingstatus !== 'waiting_payment') {
      throw new AppError(
        409,
        'INVALID_BOOKING_STATUS',
        'Booking cannot accept initial payment in current status'
      )
    }
  } else if (input.payment_stage === 'final') {
    if (existingBooking.bookingstatus !== 'waiting_final_payment') {
      throw new AppError(
        409,
        'INVALID_BOOKING_STATUS',
        'Booking cannot accept final payment in current status'
      )
    }
  }

  // ตรวจสอบความสอดคล้องระหว่าง paymentplan กับ payment_stage
  if (existingBooking.paymentplan === 'full') {
    if (input.payment_stage !== 'full') {
      throw new AppError(
        409,
        'PLAN_MISMATCH',
        'Payment plan is full, stage must be full'
      )
    }
  } else if (existingBooking.paymentplan === 'deposit') {
    if (input.payment_stage === 'full') {
      throw new AppError(
        409,
        'PLAN_MISMATCH',
        'Payment plan is deposit, stage must be deposit or final'
      )
    }
  }

  // ตรวจสอบว่า stage นี้มีรายการที่ verified หรือ pending_verifying อยู่แล้วหรือไม่
  const hasActivePaymentInStage = existingBooking.payment.some(
    (p) =>
      p.payment_stage === input.payment_stage &&
      (p.payment_status === 'verified' || p.payment_status === 'pending_verifying')
  )

  if (hasActivePaymentInStage) {
    throw new AppError(409, 'STAGE_ALREADY_PAID', 'Amount mismatch or stage already paid')
  }

  // ตรวจสอบความถูกต้องของยอดเงินที่ส่งมา
  const totalPrice = Number(existingBooking.totalprice)
  let expectedAmount: number

  if (input.payment_stage === 'deposit') {
    expectedAmount = Math.round(totalPrice * 0.3)
  } else if (input.payment_stage === 'final') {
    const verifiedDeposit = existingBooking.payment
      .filter((p) => p.payment_stage === 'deposit' && p.payment_status === 'verified')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    expectedAmount = totalPrice - (verifiedDeposit || Math.round(totalPrice * 0.3))
  } else {
    // stage === 'full'
    expectedAmount = totalPrice
  }

  if (Math.abs(input.amount - expectedAmount) > 0.01) {
    throw new AppError(409, 'AMOUNT_MISMATCH', 'Amount mismatch or stage already paid')
  }

  // อัปโหลดไฟล์สลิปขึ้น Cloud Storage (Supabase)
  const slipUrl = await uploadSlipImage(file, existingBooking.bookingid)

  // บันทึกข้อมูล payment
  const newPayment = await prisma.payment.create({
    data: {
      bookingid: existingBooking.bookingid,
      amount: input.amount,
      paymenttype: input.paymentType,
      payment_stage: input.payment_stage,
      payment_status: 'pending_verifying',
      slip_image: slipUrl,
    },
  })

  return {
    paymentId: newPayment.paymentid,
    payment_status: newPayment.payment_status,
    slip_image: newPayment.slip_image,
  }
}

/**
 * พี่เลี้ยงตรวจสอบและยืนยันหรือปฏิเสธสลิปการโอนเงิน (PATCH /api/bookings/:id/verify-payment)
 */
export const verifyPaymentSlip = async (
  sitterUserId: number,
  bookingId: number,
  paymentId: number,
  action: VerifyPaymentAction
): Promise<PaymentVerifyResponse> => {
  const existingBooking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    include: {
      services: {
        select: { servicename: true },
      },
      petowner: {
        include: {
          USER: {
            select: { userid: true, username: true, email: true },
          },
        },
      },
      petsitter: {
        include: {
          USER: {
            select: { userid: true, username: true },
          },
        },
      },
      payment: {
        where: { paymentid: paymentId },
      },
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking or payment not found')
  }

  // ตรวจสอบสิทธิ์ว่าต้องเป็นพี่เลี้ยงที่รับผิดชอบการจองนี้
  if (existingBooking.sitterid !== sitterUserId) {
    throw new AppError(403, 'FORBIDDEN', 'Not the assigned sitter of this booking')
  }

  const targetPayment = existingBooking.payment[0]
  if (!targetPayment) {
    throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Booking or payment not found')
  }

  if (targetPayment.payment_status !== 'pending_verifying') {
    throw new AppError(409, 'PAYMENT_ALREADY_PROCESSED', 'Payment already verified or rejected')
  }

  let nextBookingStatus: booking_status = existingBooking.bookingstatus
  let nextPaymentStatus: payment_status = 'pending_verifying'

  if (action === 'verify') {
    nextPaymentStatus = 'verified'
    if (targetPayment.payment_stage === 'deposit' || targetPayment.payment_stage === 'full') {
      nextBookingStatus = 'confirmed'
    } else if (targetPayment.payment_stage === 'final') {
      nextBookingStatus = 'completed'
    }
  } else {
    // action === 'reject'
    nextPaymentStatus = 'rejected'
    // คงสถานะ booking ไว้ที่เดิม เพื่อให้ Pet Owner ส่งสลิปใหม่
    nextBookingStatus = existingBooking.bookingstatus
  }

  // บันทึกการเปลี่ยนแปลงใน Transaction
  await prisma.$transaction([
    prisma.payment.update({
      where: { paymentid: paymentId },
      data: { payment_status: nextPaymentStatus },
    }),
    ...(nextBookingStatus !== existingBooking.bookingstatus
      ? [
          prisma.booking.update({
            where: { bookingid: bookingId },
            data: { bookingstatus: nextBookingStatus },
          }),
        ]
      : []),
  ])

  // ส่งอีเมลแจ้งเตือน Pet Owner แบบ Non-blocking safe dispatch
  const ownerUser = existingBooking.petowner?.USER
  const sitterUser = existingBooking.petsitter?.USER
  if (ownerUser?.email) {
    sendPaymentStatusNotificationEmail({
      toEmail: ownerUser.email,
      ownerUsername: ownerUser.username,
      sitterUsername: sitterUser?.username || 'พี่เลี้ยง',
      serviceName: existingBooking.services?.servicename || 'บริการสัตว์เลี้ยง',
      action,
      paymentStage: targetPayment.payment_stage,
      amount: Number(targetPayment.amount),
      bookingId: existingBooking.bookingid,
      bookingStatus: nextBookingStatus,
    }).catch((err) => {
      console.error('[PaymentService] Error dispatching payment notification email:', err)
    })
  }

  return {
    paymentId: targetPayment.paymentid,
    payment_status: nextPaymentStatus,
    bookingstatus: nextBookingStatus,
  }
}
