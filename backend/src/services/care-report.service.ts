import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { deleteCareReportPhoto, uploadCareReportPhoto } from '../utils/supabase/storage.js'
import { CreateCareReportInput } from '../validators/careReport.validator.js'

/**
 * รูปแบบข้อมูลรายงานการดูแลสัตว์เลี้ยง (docs/API.md § PART 3: 6.1 / 6.2)
 */
export interface CareReportResponse {
  reportId: number
  bookingId: number
  reportDetail: string
  photoUrl: string | null
  createdAt: string
}

const toCareReportResponse = (report: {
  reportid: number
  bookingid: number
  report_detail: string | null
  photo_url: string | null
  created_at: Date
}): CareReportResponse => ({
  reportId: report.reportid,
  bookingId: report.bookingid,
  reportDetail: report.report_detail ?? '',
  photoUrl: report.photo_url,
  createdAt: report.created_at.toISOString(),
})

const notInProgressError = () =>
  new AppError(
    400,
    'BOOKING_NOT_IN_PROGRESS',
    'Care report can only be submitted during active service (status: in_progress)'
  )

/**
 * พี่เลี้ยงส่งรายงานการดูแลสัตว์เลี้ยงระหว่างให้บริการ (US7-3)
 *
 * ส่งได้เฉพาะพี่เลี้ยงของการจองนั้น และเฉพาะตอนสถานะเป็น in_progress
 * ตรวจเงื่อนไขทั้งหมดก่อนอัปโหลดรูป เพื่อไม่ให้มีไฟล์ค้างใน Storage เมื่อคำขอไม่ผ่าน
 */
export const createCareReport = async (
  sitterUserId: number,
  bookingId: number,
  input: CreateCareReportInput,
  photo?: Express.Multer.File
): Promise<CareReportResponse> => {
  const booking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    select: { ownerid: true, sitterid: true, bookingstatus: true },
  })

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  if (booking.sitterid !== sitterUserId) {
    throw new AppError(403, 'FORBIDDEN', 'Not the assigned sitter of this booking')
  }

  if (booking.bookingstatus !== 'in_progress') {
    throw notInProgressError()
  }

  const photoUrl = photo ? await uploadCareReportPhoto(photo, bookingId) : null

  try {
    return await prisma.$transaction(async (tx) => {
      // ตรวจสถานะซ้ำพร้อมล็อกแถว booking (UPDATE แบบไม่เปลี่ยนค่า) กันงานถูกจบ/ยกเลิกระหว่างอัปโหลดรูป
      const stillInProgress = await tx.booking.updateMany({
        where: { bookingid: bookingId, sitterid: sitterUserId, bookingstatus: 'in_progress' },
        data: { bookingstatus: 'in_progress' },
      })
      if (stillInProgress.count === 0) {
        throw notInProgressError()
      }

      const report = await tx.report.create({
        data: {
          bookingid: bookingId,
          // คู่สัญญาดึงจากการจองเสมอ ไม่รับจาก request เพื่อไม่ให้ข้อมูลขัดกัน
          ownerid: booking.ownerid,
          sitterid: sitterUserId,
          report_detail: input.reportDetail,
          photo_url: photoUrl,
        },
      })

      return toCareReportResponse(report)
    })
  } catch (error) {
    // บันทึกไม่สำเร็จ → ลบรูปที่เพิ่งอัปโหลดทิ้ง ไม่ให้เป็นไฟล์กำพร้าใน Storage
    if (photoUrl) {
      await deleteCareReportPhoto(photoUrl)
    }
    throw error
  }
}
