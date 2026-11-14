import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { booking_status, payment_stage, payment_status } from '../generated/prisma/enums.js'
import { SubmitPaymentDTO, VerifyPaymentAction } from '../validators/payment.validator.js'
import { deleteSlipImage, uploadSlipImage } from '../utils/supabase/storage.js'
import { sendPaymentStatusNotificationEmail } from './mail.service.js'
import { verifySlipWithThunder } from './thunder-slip.service.js'

export const DEPOSIT_RATE = 0.3

export interface PaymentItemResponse {
  paymentId: number
  amount: number
  payment_stage: payment_stage
  payment_status: payment_status
  slip_image: string | null
  paid_at: string
}

export interface SitterPaymentInfoResponse {
  sitterId: number | null
  accountName: string | null
  qrCodeUrl: string | null
}

export interface PaymentSummaryResponse {
  bookingId: number
  bookingstatus: string
  totalPrice: number
  paymentplan: string | null
  depositAmount: number
  remainingAmount: number
  sitterPaymentInfo: SitterPaymentInfoResponse
  payments: PaymentItemResponse[]
}

export interface PaymentSubmitResponse {
  paymentId: number
  payment_status: payment_status
  slip_image: string | null
  bookingstatus?: string
  senderName?: { th?: string; en?: string }
  receiverName?: { th?: string; en?: string }
  transRef?: string
  verifiedBy?: 'thunder_solution' | 'manual'
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
        select: {
          userid: true,
          account_name: true,
          qr_code_url: true,
        },
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
    sitterPaymentInfo: {
      sitterId: existingBooking.petsitter?.userid ?? existingBooking.sitterid ?? null,
      accountName: existingBooking.petsitter?.account_name ?? null,
      qrCodeUrl: existingBooking.petsitter?.qr_code_url ?? null,
    },
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
      petowner: {
        include: {
          USER: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      },
      services: {
        select: {
          servicename: true,
        },
      },
      petsitter: {
        include: {
          USER: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  // ตรวจสอบสิทธิ์ว่าต้องเป็นเจ้าของสัตว์เลี้ยงของ booking นี้
  if (existingBooking.ownerid !== ownerUserId) {
    throw new AppError(403, 'FORBIDDEN', 'คุณไม่มีสิทธิ์ทำรายการสำหรับการจองนี้')
  }

  if (existingBooking.bookingstatus === 'completed') {
    throw new AppError(
      409,
      'BOOKING_ALREADY_COMPLETED',
      'การจองนี้ชำระเงินส่วนที่เหลือเรียบร้อยแล้ว'
    )
  }

  // อนุญาตเฉพาะการชำระงวดแรก/เต็มจำนวน หรือชำระยอดคงเหลือ
  if (
    existingBooking.bookingstatus !== 'waiting_payment'
    && existingBooking.bookingstatus !== 'waiting_final_payment'
  ) {
    throw new AppError(
      409,
      'INVALID_BOOKING_STATUS',
      'Booking cannot accept payment in current status'
    )
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
    if (input.payment_stage === 'final') {
      throw new AppError(
        409,
        'FINAL_PAYMENT_ALREADY_PROCESSING',
        'รายการชำระเงินส่วนที่เหลือนี้กำลังดำเนินการหรือชำระเรียบร้อยแล้ว'
      )
    }
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
    const paidDepositAmount = verifiedDeposit || Math.round(totalPrice * 0.3)
    expectedAmount = totalPrice - paidDepositAmount
  } else {
    // stage === 'full'
    expectedAmount = totalPrice
  }

  if (Math.abs(input.amount - expectedAmount) > 0.01) {
    throw new AppError(409, 'AMOUNT_MISMATCH', 'Amount mismatch or stage already paid')
  }

  // ตรวจสอบว่าพี่เลี้ยงได้ตั้งค่าชื่อบัญชีผู้รับเงินและ QR Code แล้วหรือยัง
  const sitterAccountName = existingBooking.petsitter?.account_name?.trim() || null
  const sitterQrCodeUrl = existingBooking.petsitter?.qr_code_url?.trim() || null

  if (!sitterAccountName || !sitterQrCodeUrl) {
    throw new AppError(
      400,
      'SITTER_PAYMENT_INFO_MISSING',
      'พี่เลี้ยงยังไม่ได้ตั้งค่าบัญชีรับเงินหรือ QR Code กรุณาติดต่อพี่เลี้ยงก่อนชำระเงิน'
    )
  }

  // อัปโหลดไฟล์สลิปขึ้น Cloud Storage (Supabase)
  const slipUrl = await uploadSlipImage(file, existingBooking.bookingid)

  try {
    // ตรวจสอบสลิปอัตโนมัติด้วย Thunder Solution API (เช็คยอดเงิน, เวลาโอนหลังวันจอง, และชื่อผู้รับตรงกับพี่เลี้ยง)
    const thunderResult = await verifySlipWithThunder(slipUrl, expectedAmount, {
      minTransferDate: existingBooking.bookingdate,
      expectedReceiverName: sitterAccountName,
    })

    if (!thunderResult.isValid && !thunderResult.isFallback) {
      // Fail-Fast: สลิปไม่ถูกต้อง / ยอดไม่ตรง / สลิปซ้ำ ปฏิเสธทันทีเพื่อให้ลูกค้าอัปโหลดใหม่
      throw new AppError(
        400,
        'INVALID_PAYMENT_SLIP',
        thunderResult.errorReason || 'สลิปการโอนเงินไม่ถูกต้อง'
      )
    }

    const requiredBookingStatus: booking_status =
      input.payment_stage === 'final' ? 'waiting_final_payment' : 'waiting_payment'

    if (thunderResult.isValid) {
      // Auto-Verify ผ่านการตรวจสอบ 100%
      let targetBookingStatus: booking_status
      if (input.payment_stage === 'deposit') {
        targetBookingStatus = 'deposit_paid'
      } else if (input.payment_stage === 'final') {
        targetBookingStatus = 'completed'
      } else {
        // stage === 'full'
        targetBookingStatus = 'confirmed'
      }

      const [newPayment, updatedBooking] = await prisma.$transaction(async (tx) => {
        // ล็อกแถวใบจองเพื่อป้องกันการส่งสลิปงวดเดียวกันซ้อนกันพร้อมกัน (Race Condition)
        await tx.$queryRaw`SELECT bookingid FROM booking WHERE bookingid = ${existingBooking.bookingid} FOR UPDATE`

        const concurrentPayment = await tx.payment.findFirst({
          where: {
            bookingid: existingBooking.bookingid,
            payment_stage: input.payment_stage,
            payment_status: { in: ['verified', 'pending_verifying'] },
          },
          select: { paymentid: true },
        })

        if (concurrentPayment) {
          if (input.payment_stage === 'final') {
            throw new AppError(
              409,
              'FINAL_PAYMENT_ALREADY_PROCESSING',
              'รายการชำระเงินส่วนที่เหลือนี้กำลังดำเนินการหรือชำระเรียบร้อยแล้ว'
            )
          }
          throw new AppError(409, 'STAGE_ALREADY_PAID', 'Amount mismatch or stage already paid')
        }

        const bookingUpdateResult = await tx.booking.updateMany({
          where: {
            bookingid: existingBooking.bookingid,
            bookingstatus: requiredBookingStatus,
          },
          data: {
            bookingstatus: targetBookingStatus,
          },
        })

        if (bookingUpdateResult.count === 0) {
          throw new AppError(
            409,
            'INVALID_BOOKING_STATUS',
            'Booking status changed concurrently or stage already paid'
          )
        }

        const createdPayment = await tx.payment.create({
          data: {
            bookingid: existingBooking.bookingid,
            amount: expectedAmount,
            paymenttype: input.paymentType,
            payment_stage: input.payment_stage,
            payment_status: 'verified',
            slip_image: slipUrl,
          },
        })

        return [createdPayment, { bookingstatus: targetBookingStatus }] as const
      })

      // ส่งอีเมลแจ้งเตือนถึงเจ้าของสัตว์เลี้ยง
      const ownerUser = existingBooking.petowner?.USER
      const sitterUser = existingBooking.petsitter?.USER
      if (ownerUser?.email) {
        sendPaymentStatusNotificationEmail({
          toEmail: ownerUser.email,
          ownerUsername: ownerUser.username,
          sitterUsername: sitterUser?.username || 'พี่เลี้ยง',
          serviceName: existingBooking.services?.servicename || 'บริการสัตว์เลี้ยง',
          action: 'verify',
          paymentStage: input.payment_stage,
          amount: expectedAmount,
          bookingId: existingBooking.bookingid,
          bookingStatus: targetBookingStatus,
        }).catch((err) => {
          console.error('[PaymentService] Error dispatching auto-verify notification email:', err)
        })
      }

      return {
        paymentId: newPayment.paymentid,
        payment_status: newPayment.payment_status,
        slip_image: newPayment.slip_image,
        bookingstatus: updatedBooking.bookingstatus,
        verifiedBy: 'thunder_solution',
        senderName: thunderResult.senderName,
        receiverName: thunderResult.receiverName,
        transRef: thunderResult.transRef,
      }
    }

    // กรณี Fallback (เช่น ยังไม่ได้คอนฟิก THUNDER_API_KEY หรือ Thunder API ขัดข้อง):
    // บันทึกสถานะ pending_verifying ให้พี่เลี้ยงเป็นผู้ตรวจสอบด้วยตนเองภายใต้ Row Lock
    const newPayment = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT bookingid FROM booking WHERE bookingid = ${existingBooking.bookingid} FOR UPDATE`

      const latestBooking = await tx.booking.findUnique({
        where: { bookingid: existingBooking.bookingid },
        select: { bookingstatus: true },
      })

      if (!latestBooking || latestBooking.bookingstatus !== requiredBookingStatus) {
        throw new AppError(
          409,
          'INVALID_BOOKING_STATUS',
          'Booking cannot accept payment in current status'
        )
      }

      const concurrentPayment = await tx.payment.findFirst({
        where: {
          bookingid: existingBooking.bookingid,
          payment_stage: input.payment_stage,
          payment_status: { in: ['verified', 'pending_verifying'] },
        },
        select: { paymentid: true },
      })

      if (concurrentPayment) {
        if (input.payment_stage === 'final') {
          throw new AppError(
            409,
            'FINAL_PAYMENT_ALREADY_PROCESSING',
            'รายการชำระเงินส่วนที่เหลือนี้กำลังดำเนินการหรือชำระเรียบร้อยแล้ว'
          )
        }
        throw new AppError(409, 'STAGE_ALREADY_PAID', 'Amount mismatch or stage already paid')
      }

      return tx.payment.create({
        data: {
          bookingid: existingBooking.bookingid,
          amount: expectedAmount,
          paymenttype: input.paymentType,
          payment_stage: input.payment_stage,
          payment_status: 'pending_verifying',
          slip_image: slipUrl,
        },
      })
    })

    return {
      paymentId: newPayment.paymentid,
      payment_status: newPayment.payment_status,
      slip_image: newPayment.slip_image,
      bookingstatus: input.payment_stage === 'final' ? 'waiting_final_payment' : 'waiting_payment',
      verifiedBy: 'manual',
    }
  } catch (error) {
    // ลบไฟล์สลิปออกจาก Supabase Storage ทันทีเมื่อการตรวจสลิปไม่ผ่านหรือบันทึก DB ล้มเหลว
    await deleteSlipImage(slipUrl)
    throw error
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

  if (
    targetPayment.payment_stage === 'final'
    && existingBooking.bookingstatus !== 'waiting_final_payment'
  ) {
    throw new AppError(
      409,
      'INVALID_BOOKING_STATUS',
      'Final payment is only allowed when booking is waiting_final_payment'
    )
  }

  let nextBookingStatus: booking_status = existingBooking.bookingstatus
  let nextPaymentStatus: payment_status = 'pending_verifying'

  if (action === 'verify') {
    nextPaymentStatus = 'verified'
    if (targetPayment.payment_stage === 'deposit') {
      nextBookingStatus = 'deposit_paid'
    } else if (targetPayment.payment_stage === 'full') {
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

  // บันทึกการเปลี่ยนแปลงใน Transaction พร้อม Atomic Status Guard ป้องกัน Race Condition
  await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.updateMany({
      where: {
        paymentid: paymentId,
        bookingid: bookingId,
        payment_status: 'pending_verifying',
      },
      data: {
        payment_status: nextPaymentStatus,
        ...(action === 'reject' ? { slip_image: null } : {}),
      },
    })

    if (updatedPayment.count === 0) {
      throw new AppError(
        409,
        'PAYMENT_ALREADY_PROCESSED',
        'Payment already verified or rejected'
      )
    }

    if (nextBookingStatus !== existingBooking.bookingstatus) {
      const updatedBooking = await tx.booking.updateMany({
        where: {
          bookingid: bookingId,
          bookingstatus: existingBooking.bookingstatus,
        },
        data: { bookingstatus: nextBookingStatus },
      })

      if (updatedBooking.count === 0) {
        throw new AppError(
          409,
          'INVALID_BOOKING_STATUS',
          'Final payment booking status changed concurrently or is invalid'
        )
      }
    }
  })

  // หากพี่เลี้ยงปฏิเสธสลิป ให้ลบไฟล์สลิปเดิมออกจาก Storage เพื่อไม่ให้เกิดไฟล์ค้าง (Orphaned file)
  if (action === 'reject' && targetPayment.slip_image) {
    await deleteSlipImage(targetPayment.slip_image)
  }

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
