import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_DETAIL_REQUIRED_MESSAGE,
  hasValidCareReportPhotoContent,
  isAllowedCareReportPhotoType,
  validateCreateCareReportInput,
} from '../careReport.validator.js'
import { AppError } from '../../utils/errors.js'

const expectAppError = (fn: () => unknown, statusCode: number, errorCode: string): AppError => {
  try {
    fn()
  } catch (err) {
    assert.ok(err instanceof AppError, 'expected AppError')
    assert.equal(err.statusCode, statusCode)
    assert.equal(err.errorCode, errorCode)
    return err
  }
  assert.fail('expected function to throw')
}

describe('validateCreateCareReportInput', () => {
  it('accepts notes and trims surrounding whitespace', () => {
    assert.deepEqual(validateCreateCareReportInput({ reportDetail: '  น้องทานข้าวหมดแล้ว  ' }), {
      reportDetail: 'น้องทานข้าวหมดแล้ว',
    })
  })

  it('rejects missing, empty or whitespace-only notes with the AC message', () => {
    for (const body of [undefined, null, {}, { reportDetail: '' }, { reportDetail: '   \n\t ' }]) {
      const err = expectAppError(() => validateCreateCareReportInput(body), 400, 'REPORT_DETAIL_REQUIRED')
      assert.equal(err.message, REPORT_DETAIL_REQUIRED_MESSAGE)
    }
  })

  it('rejects non-string notes', () => {
    for (const reportDetail of [123, true, ['text'], { text: 'x' }]) {
      expectAppError(() => validateCreateCareReportInput({ reportDetail }), 400, 'REPORT_DETAIL_REQUIRED')
    }
  })

  it('accepts notes exactly at the length limit', () => {
    const reportDetail = 'ก'.repeat(MAX_REPORT_DETAIL_LENGTH)
    assert.equal(validateCreateCareReportInput({ reportDetail }).reportDetail.length, MAX_REPORT_DETAIL_LENGTH)
  })

  it('counts emoji as one character each', () => {
    const reportDetail = '🐶'.repeat(MAX_REPORT_DETAIL_LENGTH)
    assert.equal(validateCreateCareReportInput({ reportDetail }).reportDetail, reportDetail)
    expectAppError(() => validateCreateCareReportInput({ reportDetail: `${reportDetail}🐶` }), 400, 'REPORT_DETAIL_TOO_LONG')
  })

  it('rejects notes longer than the limit', () => {
    const reportDetail = 'a'.repeat(MAX_REPORT_DETAIL_LENGTH + 1)
    expectAppError(() => validateCreateCareReportInput({ reportDetail }), 400, 'REPORT_DETAIL_TOO_LONG')
  })

  it('measures the limit after trimming', () => {
    const reportDetail = `  ${'a'.repeat(MAX_REPORT_DETAIL_LENGTH)}  `
    assert.equal(validateCreateCareReportInput({ reportDetail }).reportDetail.length, MAX_REPORT_DETAIL_LENGTH)
  })
})

describe('isAllowedCareReportPhotoType', () => {
  it('allows JPEG (incl. image/jpg and image/pjpeg), PNG and WebP', () => {
    for (const type of ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp']) {
      assert.equal(isAllowedCareReportPhotoType(type), true, type)
    }
  })

  it('rejects GIF, SVG and non-image files', () => {
    for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain', '']) {
      assert.equal(isAllowedCareReportPhotoType(type), false, type)
    }
  })
})

describe('hasValidCareReportPhotoContent', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
  ])
  const webp = Buffer.concat([
    Buffer.from('RIFF', 'ascii'),
    Buffer.from([0x0c, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP', 'ascii'),
    Buffer.from('VP8 ', 'ascii'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
  ])

  it('accepts real JPEG, PNG and WebP content with the matching type', () => {
    assert.equal(hasValidCareReportPhotoContent({ buffer: jpeg, mimetype: 'image/jpeg' }), true)
    assert.equal(hasValidCareReportPhotoContent({ buffer: jpeg, mimetype: 'image/jpg' }), true)
    assert.equal(hasValidCareReportPhotoContent({ buffer: jpeg, mimetype: 'image/pjpeg' }), true)
    assert.equal(hasValidCareReportPhotoContent({ buffer: png, mimetype: 'image/png' }), true)
    assert.equal(hasValidCareReportPhotoContent({ buffer: webp, mimetype: 'image/webp' }), true)
  })

  it('rejects non-image content disguised as an image type', () => {
    const text = Buffer.from('this is not an image, just text pretending to be one')
    assert.equal(hasValidCareReportPhotoContent({ buffer: text, mimetype: 'image/png' }), false)
    assert.equal(hasValidCareReportPhotoContent({ buffer: Buffer.alloc(0), mimetype: 'image/jpeg' }), false)
  })

  it('rejects an image whose content does not match the declared type', () => {
    assert.equal(hasValidCareReportPhotoContent({ buffer: jpeg, mimetype: 'image/png' }), false)
    assert.equal(hasValidCareReportPhotoContent({ buffer: png, mimetype: 'image/webp' }), false)
  })

  it('rejects types that care reports do not accept even if the content is valid', () => {
    assert.equal(hasValidCareReportPhotoContent({ buffer: png, mimetype: 'image/gif' }), false)
  })
})
