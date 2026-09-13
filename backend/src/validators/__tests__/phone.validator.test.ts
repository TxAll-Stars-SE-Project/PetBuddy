import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateAndNormalizeThaiPhone } from '../phone.validator.js'

describe('Thai Phone Validator', () => {
  it('should accept valid mobile numbers', () => {
    const r1 = validateAndNormalizeThaiPhone('0812345678')
    assert.equal(r1.isValid, true)
    assert.equal(r1.normalized, '0812345678')

    const r2 = validateAndNormalizeThaiPhone('0912345678')
    assert.equal(r2.isValid, true)
    assert.equal(r2.normalized, '0912345678')

    const r3 = validateAndNormalizeThaiPhone('0612345678')
    assert.equal(r3.isValid, true)
    assert.equal(r3.normalized, '0612345678')
  })

  it('should format and normalize numbers with dashes, spaces, and +66', () => {
    const r1 = validateAndNormalizeThaiPhone('081-234-5678')
    assert.equal(r1.isValid, true)
    assert.equal(r1.normalized, '0812345678')

    const r2 = validateAndNormalizeThaiPhone('+66 81 234 5678')
    assert.equal(r2.isValid, true)
    assert.equal(r2.normalized, '0812345678')

    const r3 = validateAndNormalizeThaiPhone('+66812345678')
    assert.equal(r3.isValid, true)
    assert.equal(r3.normalized, '0812345678')
  })

  it('should accept valid Thai fixed-line numbers', () => {
    const r1 = validateAndNormalizeThaiPhone('021234567')
    assert.equal(r1.isValid, true)
    assert.equal(r1.normalized, '021234567')

    const r2 = validateAndNormalizeThaiPhone('053123456')
    assert.equal(r2.isValid, true)
    assert.equal(r2.normalized, '053123456')
  })

  it('should reject invalid or obsolete phone numbers', () => {
    const r1 = validateAndNormalizeThaiPhone('0112345678')
    assert.equal(r1.isValid, false)

    const r2 = validateAndNormalizeThaiPhone('0012345678')
    assert.equal(r2.isValid, false)

    const r3 = validateAndNormalizeThaiPhone('12345')
    assert.equal(r3.isValid, false)

    const r4 = validateAndNormalizeThaiPhone('notaphonenumber')
    assert.equal(r4.isValid, false)

    const r5 = validateAndNormalizeThaiPhone('')
    assert.equal(r5.isValid, false)
  })
})
