import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateEmailDomain } from '../emailDomain.validator.js'

describe('Email Domain Validator', () => {
  it('should accept valid and deliverable domains', async () => {
    const res = await validateEmailDomain('user@gmail.com')
    assert.equal(res.isValid, true)
  })

  it('should reject nonexistent domains with ENOTFOUND', async () => {
    const res = await validateEmailDomain('user@nonexistentdomain999999999xyz.com')
    assert.equal(res.isValid, false)
    assert.match(res.error || '', /โดเมนของอีเมลไม่สามารถใช้งานได้/)
  })

  it('should reject invalid domain syntax', async () => {
    const res1 = await validateEmailDomain('user@localhost')
    assert.equal(res1.isValid, false)

    const res2 = await validateEmailDomain('user@.com')
    assert.equal(res2.isValid, false)

    const res3 = await validateEmailDomain('not-an-email')
    assert.equal(res3.isValid, false)
  })

  it('should allow test domains', async () => {
    const res = await validateEmailDomain('test@service.test')
    assert.equal(res.isValid, true)
  })
})
