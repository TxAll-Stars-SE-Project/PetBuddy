import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateUpdateProfileInput } from '../profile.validator.js'
import { AppError } from '../../utils/errors.js'

describe('Profile Update Validator', () => {
  it('should successfully validate partial update with user fields', async () => {
    const result = await validateUpdateProfileInput({
      username: 'somchai_new',
      tel: '081-234-5678',
    })

    assert.equal(result.username, 'somchai_new')
    assert.equal(result.tel, '0812345678')
    assert.equal(result.email, undefined)
  })

  it('should successfully validate valid sitter experience', async () => {
    const result = await validateUpdateProfileInput({
      experience: '  มีประสบการณ์ดูแลสุนัขพันธุ์ใหญ่ 4 ปี  ',
    })

    assert.equal(result.experience, 'มีประสบการณ์ดูแลสุนัขพันธุ์ใหญ่ 4 ปี')
  })

  it('should allow clearing experience with null', async () => {
    const result = await validateUpdateProfileInput({
      experience: null,
    })

    assert.equal(result.experience, null)
  })

  it('should throw AppError when experience is an empty string', async () => {
    await assert.rejects(
      async () => {
        await validateUpdateProfileInput({ experience: '   ' })
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const expErr = err.errors?.find((e) => e.field === 'experience')
        assert(expErr !== undefined)
        assert.equal(expErr?.message, 'กรุณากรอกประสบการณ์')
        return true
      }
    )
  })

  it('should throw AppError when experience exceeds 500 characters', async () => {
    await assert.rejects(
      async () => {
        await validateUpdateProfileInput({ experience: 'a'.repeat(501) })
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const expErr = err.errors?.find((e) => e.field === 'experience')
        assert(expErr !== undefined)
        assert.equal(expErr?.message, 'ประสบการณ์ต้องไม่เกิน 500 ตัวอักษร')
        return true
      }
    )
  })

  it('should ignore restricted fields like role, userid, password, and thaiId', async () => {
    const result = await validateUpdateProfileInput({
      role: 'sitter',
      userid: 999,
      password: 'newPassword123',
      thaiId: '1100702476576',
      thaiid: '1100702476576',
      username: 'valid_user',
    })

    assert.equal(result.username, 'valid_user')
    assert.equal((result as Record<string, unknown>).role, undefined)
    assert.equal((result as Record<string, unknown>).userid, undefined)
    assert.equal((result as Record<string, unknown>).password, undefined)
    assert.equal((result as Record<string, unknown>).thaiId, undefined)
    assert.equal((result as Record<string, unknown>).thaiid, undefined)
  })

  it('should return empty object when no fields are passed', async () => {
    const result = await validateUpdateProfileInput({})
    assert.deepEqual(result, {})
  })
})
