import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_DETAIL_REQUIRED_MESSAGE,
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
  it('allows JPEG, PNG and WebP', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      assert.equal(isAllowedCareReportPhotoType(type), true, type)
    }
  })

  it('rejects GIF, SVG and non-image files', () => {
    for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain', '']) {
      assert.equal(isAllowedCareReportPhotoType(type), false, type)
    }
  })
})
