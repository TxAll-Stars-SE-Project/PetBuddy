import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { AppError } from '../../utils/errors.js'

// mock ก่อน import service — เทสไม่แตะ DB หรือ Supabase จริง
const findUnique = jest.fn<(args: unknown) => Promise<unknown>>()
const updateMany = jest.fn<(args: unknown) => Promise<{ count: number }>>()
const create = jest.fn<(args: unknown) => Promise<unknown>>()
const uploadCareReportPhoto = jest.fn<(file: unknown, bookingId: number) => Promise<string>>()
const deleteCareReportPhoto = jest.fn<(url: string) => Promise<void>>()

// $transaction ส่ง client ตัวเดียวกันให้ callback ใช้เป็น tx
const prismaMock = {
  booking: { findUnique, updateMany },
  report: { create },
  $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock),
}
jest.unstable_mockModule('../../utils/prisma.js', () => ({ default: prismaMock }))
jest.unstable_mockModule('../../utils/supabase/storage.js', () => ({
  uploadCareReportPhoto,
  deleteCareReportPhoto,
}))

const { createCareReport } = await import('../care-report.service.js')

const SITTER_ID = 20
const OWNER_ID = 10
const BOOKING_ID = 7
const CREATED_AT = new Date('2026-11-05T08:30:00.000Z')
const PHOTO_URL = 'https://storage.example.com/care-reports/7/photo.png'
const photo = { buffer: Buffer.from('png'), mimetype: 'image/png' } as Express.Multer.File

const bookingWith = (overrides: Partial<{ ownerid: number; sitterid: number | null; bookingstatus: string }> = {}) => ({
  ownerid: OWNER_ID,
  sitterid: SITTER_ID,
  bookingstatus: 'in_progress',
  ...overrides,
})

const savedReport = (overrides: Partial<{ report_detail: string | null; photo_url: string | null }> = {}) => ({
  reportid: 1,
  bookingid: BOOKING_ID,
  report_detail: 'น้องทานข้าวหมดแล้ว',
  photo_url: null,
  created_at: CREATED_AT,
  ...overrides,
})

const expectAppError = async (promise: Promise<unknown>, statusCode: number, errorCode: string) => {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  )
  expect(err).toBeInstanceOf(AppError)
  expect((err as AppError).statusCode).toBe(statusCode)
  expect((err as AppError).errorCode).toBe(errorCode)
}

describe('createCareReport (Unit)', () => {
  beforeEach(() => {
    findUnique.mockReset()
    updateMany.mockReset().mockResolvedValue({ count: 1 })
    create.mockReset()
    uploadCareReportPhoto.mockReset()
    deleteCareReportPhoto.mockReset()
  })

  it('throws 404 BOOKING_NOT_FOUND when the booking does not exist', async () => {
    findUnique.mockResolvedValue(null)

    await expectAppError(createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }), 404, 'BOOKING_NOT_FOUND')
    expect(create).not.toHaveBeenCalled()
  })

  it('throws 403 FORBIDDEN when the caller is not the assigned sitter', async () => {
    findUnique.mockResolvedValue(bookingWith({ sitterid: 99 }))

    await expectAppError(createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }), 403, 'FORBIDDEN')
    expect(create).not.toHaveBeenCalled()
  })

  it.each(['pending', 'confirmed', 'deposit_paid', 'waiting_final_payment', 'completed', 'cancelled'])(
    'throws 400 BOOKING_NOT_IN_PROGRESS when status is %s',
    async (bookingstatus) => {
      findUnique.mockResolvedValue(bookingWith({ bookingstatus }))

      await expectAppError(
        createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }, photo),
        400,
        'BOOKING_NOT_IN_PROGRESS'
      )
      // ตรวจเงื่อนไขก่อนอัปโหลด จึงไม่มีไฟล์ค้างใน Storage
      expect(uploadCareReportPhoto).not.toHaveBeenCalled()
      expect(create).not.toHaveBeenCalled()
    }
  )

  it('saves a text-only report with owner/sitter taken from the booking and returns the API shape', async () => {
    findUnique.mockResolvedValue(bookingWith())
    create.mockResolvedValue(savedReport())

    const result = await createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'น้องทานข้าวหมดแล้ว' })

    expect(uploadCareReportPhoto).not.toHaveBeenCalled()
    expect(updateMany).toHaveBeenCalledWith({
      where: { bookingid: BOOKING_ID, sitterid: SITTER_ID, bookingstatus: 'in_progress' },
      data: { bookingstatus: 'in_progress' },
    })
    expect(create).toHaveBeenCalledWith({
      data: {
        bookingid: BOOKING_ID,
        ownerid: OWNER_ID,
        sitterid: SITTER_ID,
        report_detail: 'น้องทานข้าวหมดแล้ว',
        photo_url: null,
      },
    })
    expect(result).toEqual({
      reportId: 1,
      bookingId: BOOKING_ID,
      reportDetail: 'น้องทานข้าวหมดแล้ว',
      photoUrl: null,
      createdAt: '2026-11-05T08:30:00.000Z',
    })
  })

  it('uploads the photo into the booking folder and saves its URL', async () => {
    findUnique.mockResolvedValue(bookingWith())
    uploadCareReportPhoto.mockResolvedValue(PHOTO_URL)
    create.mockResolvedValue(savedReport({ photo_url: PHOTO_URL }))

    const result = await createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'พาเดินเล่น' }, photo)

    expect(uploadCareReportPhoto).toHaveBeenCalledWith(photo, BOOKING_ID)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ photo_url: PHOTO_URL }) })
    )
    expect(result.photoUrl).toBe(PHOTO_URL)
  })

  it('deletes the uploaded photo and rethrows the original error when saving fails', async () => {
    const dbError = new Error('database unavailable')
    findUnique.mockResolvedValue(bookingWith())
    uploadCareReportPhoto.mockResolvedValue(PHOTO_URL)
    create.mockRejectedValue(dbError)

    await expect(createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }, photo)).rejects.toBe(dbError)
    expect(deleteCareReportPhoto).toHaveBeenCalledWith(PHOTO_URL)
  })

  it('rejects with 400 and deletes the photo when the booking leaves in_progress during upload', async () => {
    findUnique.mockResolvedValue(bookingWith())
    uploadCareReportPhoto.mockResolvedValue(PHOTO_URL)
    updateMany.mockResolvedValue({ count: 0 })

    await expectAppError(
      createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }, photo),
      400,
      'BOOKING_NOT_IN_PROGRESS'
    )
    expect(create).not.toHaveBeenCalled()
    expect(deleteCareReportPhoto).toHaveBeenCalledWith(PHOTO_URL)
  })

  it('does not try to delete a photo when saving a text-only report fails', async () => {
    const dbError = new Error('database unavailable')
    findUnique.mockResolvedValue(bookingWith())
    create.mockRejectedValue(dbError)

    await expect(createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' })).rejects.toBe(dbError)
    expect(deleteCareReportPhoto).not.toHaveBeenCalled()
  })

  it('does not save the report when the photo upload fails', async () => {
    const uploadError = new AppError(500, 'STORAGE_UPLOAD_ERROR', 'Failed to upload image to Supabase')
    findUnique.mockResolvedValue(bookingWith())
    uploadCareReportPhoto.mockRejectedValue(uploadError)

    await expect(createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' }, photo)).rejects.toBe(uploadError)
    expect(create).not.toHaveBeenCalled()
    expect(deleteCareReportPhoto).not.toHaveBeenCalled()
  })

  it('returns an empty reportDetail when the stored detail is null', async () => {
    findUnique.mockResolvedValue(bookingWith())
    create.mockResolvedValue(savedReport({ report_detail: null }))

    const result = await createCareReport(SITTER_ID, BOOKING_ID, { reportDetail: 'x' })

    expect(result.reportDetail).toBe('')
  })
})
