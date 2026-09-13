import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateThaiAddress, normalizeAddressName } from '../thaiAddress.validator.js'

describe('Thai Address Validator (Synchronized with Frontend 7,452 Subdistricts)', () => {
  it('should validate a correct Bangkok address in Thai', () => {
    const result = validateThaiAddress('กรุงเทพมหานคร', 'ปทุมวัน', 'วังใหม่', '10330')
    assert.equal(result.isValid, true)
    assert.equal(result.errors.length, 0)
    assert.deepEqual(result.normalized, {
      province: 'กรุงเทพมหานคร',
      district: 'ปทุมวัน',
      subdistrict: 'วังใหม่',
      postalCode: '10330',
    })
  })

  it('should validate newly synchronized subdistricts like ดาวคะนอง in ธนบุรี', () => {
    const result = validateThaiAddress('กรุงเทพมหานคร', 'เขตธนบุรี', 'ดาวคะนอง', '10600')
    assert.equal(result.isValid, true)
    assert.equal(result.errors.length, 0)
    assert.equal(result.normalized?.subdistrict, 'ดาวคะนอง')
  })

  it('should validate address with prefixes (จังหวัด, เขต, แขวง)', () => {
    const result = validateThaiAddress('จังหวัดกรุงเทพมหานคร', 'เขตปทุมวัน', 'แขวงวังใหม่', '10330')
    assert.equal(result.isValid, true)
    assert.equal(result.errors.length, 0)
  })

  it('should validate provincial address (Chiang Mai)', () => {
    const result = validateThaiAddress('เชียงใหม่', 'เมืองเชียงใหม่', 'ศรีภูมิ', '50200')
    assert.equal(result.isValid, true)
    assert.equal(result.errors.length, 0)
  })

  it('should reject nonexistent province', () => {
    const result = validateThaiAddress('จังหวัดดาวอังคาร', 'ปทุมวัน', 'วังใหม่', '10330')
    assert.equal(result.isValid, false)
    assert.equal(result.errors[0]?.field, 'province')
  })

  it('should reject district that does not belong to the province', () => {
    const result = validateThaiAddress('กรุงเทพมหานคร', 'เมืองเชียงใหม่', 'วังใหม่', '10330')
    assert.equal(result.isValid, false)
    assert.equal(result.errors[0]?.field, 'district')
  })

  it('should reject subdistrict that does not belong to the district', () => {
    const result = validateThaiAddress('กรุงเทพมหานคร', 'บางรัก', 'วังใหม่', '10330')
    assert.equal(result.isValid, false)
    assert.equal(result.errors[0]?.field, 'subdistrict')
  })

  it('should reject postal code that does not match subdistrict/district', () => {
    const result = validateThaiAddress('กรุงเทพมหานคร', 'ปทุมวัน', 'วังใหม่', '99999')
    assert.equal(result.isValid, false)
    assert.equal(result.errors[0]?.field, 'postalCode')
  })

  it('should normalize address name correctly', () => {
    assert.equal(normalizeAddressName('จังหวัดกรุงเทพมหานคร'), 'กรุงเทพมหานคร')
    assert.equal(normalizeAddressName('เขต ปทุมวัน'), 'ปทุมวัน')
    assert.equal(normalizeAddressName('แขวง วังใหม่'), 'วังใหม่')
    assert.equal(normalizeAddressName('Pathum Wan'), 'pathumwan')
  })
})
