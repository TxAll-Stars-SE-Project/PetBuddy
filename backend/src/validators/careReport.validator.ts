import { AppError } from '../utils/errors.js'

/**
 * กติการายงานการดูแลสัตว์เลี้ยง (US7-3) — ใช้ค่าเดียวกับฟอร์มฝั่ง frontend (CareReportFormModal)
 */
export const MAX_REPORT_DETAIL_LENGTH = 1000
export const MAX_CARE_REPORT_PHOTO_SIZE = 5 * 1024 * 1024 // 5 MB
export const CARE_REPORT_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ข้อความ error ตาม Acceptance Criteria ของ US7-3
export const REPORT_DETAIL_REQUIRED_MESSAGE = 'Please enter the required activity notes.'
export const INVALID_CARE_REPORT_PHOTO_MESSAGE = 'Invalid photo format or size limit exceeded.'

export interface CreateCareReportInput {
  reportDetail: string
}

export const isAllowedCareReportPhotoType = (mimetype: string): boolean =>
  CARE_REPORT_PHOTO_MIME_TYPES.includes(mimetype)

/**
 * ตรวจสอบ Request Body สำหรับ POST /api/bookings/:bookingId/reports
 * (รูปถ่ายตรวจที่ uploadCareReportPhotoMiddleware ก่อนถึงขั้นนี้)
 */
export const validateCreateCareReportInput = (body: unknown): CreateCareReportInput => {
  const b = (body ?? {}) as Record<string, unknown>
  const reportDetail = typeof b.reportDetail === 'string' ? b.reportDetail.trim() : ''

  if (!reportDetail) {
    throw new AppError(400, 'REPORT_DETAIL_REQUIRED', REPORT_DETAIL_REQUIRED_MESSAGE)
  }

  if (reportDetail.length > MAX_REPORT_DETAIL_LENGTH) {
    throw new AppError(
      400,
      'REPORT_DETAIL_TOO_LONG',
      `Activity notes must not exceed ${MAX_REPORT_DETAIL_LENGTH} characters.`
    )
  }

  return { reportDetail }
}
