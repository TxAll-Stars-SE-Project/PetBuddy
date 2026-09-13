import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateRegisterInput } from '../auth.validator.js'
import { AppError } from '../../utils/errors.js'

describe('Auth Register Validator', () => {
  const validRegisterPayload = {
    username: 'taninwza',
    email: 'tan@gmail.com',
    password: 'password123',
    role: 'owner',
    tel: '+66 81 234 5678',
    province: 'กรุงเทพมหานคร',
    district: 'ปทุมวัน',
    subdistrict: 'วังใหม่',
    postalCode: '10330',
  }

  it('should successfully validate and normalize valid registration data', async () => {
    const result = await validateRegisterInput(validRegisterPayload)
    assert.equal(result.username, 'taninwza')
    assert.equal(result.email, 'tan@gmail.com')
    assert.equal(result.tel, '0812345678') // Normalized phone
    assert.equal(result.province, 'กรุงเทพมหานคร')
    assert.equal(result.district, 'ปทุมวัน')
    assert.equal(result.subdistrict, 'วังใหม่')
    assert.equal(result.postalCode, '10330')
  })

  it('should throw AppError when address fields do not match', async () => {
    const invalidPayload = {
      ...validRegisterPayload,
      district: 'เมืองเชียงใหม่', // Chiang Mai district in Bangkok province
    }

    await assert.rejects(
      async () => {
        await validateRegisterInput(invalidPayload)
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const districtErr = err.errors?.find((e) => e.field === 'district')
        assert(districtErr !== undefined)
        return true
      }
    )
  })

  it('should throw AppError when phone number is invalid', async () => {
    const invalidPayload = {
      ...validRegisterPayload,
      tel: '0112345678',
    }

    await assert.rejects(
      async () => {
        await validateRegisterInput(invalidPayload)
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const telErr = err.errors?.find((e) => e.field === 'tel')
        assert(telErr !== undefined)
        return true
      }
    )
  })

  it('should throw AppError when email domain is nonexistent', async () => {
    const invalidPayload = {
      ...validRegisterPayload,
      email: 'tan@nonexistentdomain999999999xyz.com',
    }

    await assert.rejects(
      async () => {
        await validateRegisterInput(invalidPayload)
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const emailErr = err.errors?.find((e) => e.field === 'email')
        assert(emailErr !== undefined)
        return true
      }
    )
  })
})
