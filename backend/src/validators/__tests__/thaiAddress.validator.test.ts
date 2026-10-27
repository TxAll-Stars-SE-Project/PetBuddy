import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalizeProvinceDistrict, normalizeAddressName } from '../thaiAddress.validator.js'

describe('normalizeAddressName', () => {
  it('strips Thai prefixes', () => {
    assert.equal(normalizeAddressName('จังหวัดเชียงใหม่'), 'เชียงใหม่')
    assert.equal(normalizeAddressName('เขตบางรัก'), 'บางรัก')
    assert.equal(normalizeAddressName('อำเภอจอมทอง'), 'จอมทอง')
  })
  it('lowercases and removes spaces / dashes for English names', () => {
    assert.equal(normalizeAddressName('Chiang Mai'), 'chiangmai')
    assert.equal(normalizeAddressName('Khet Bang-Rak'), 'bangrak')
  })
  it('returns empty string for empty input', () => {
    assert.equal(normalizeAddressName(''), '')
    assert.equal(normalizeAddressName('   '), '')
  })
})

describe('canonicalizeProvinceDistrict', () => {
  it('returns nothing and no errors when both are empty', () => {
    assert.deepEqual(canonicalizeProvinceDistrict('', ''), { errors: [] })
  })

  it('canonicalizes a Thai province', () => {
    const out = canonicalizeProvinceDistrict('เชียงใหม่', '')
    assert.equal(out.province, 'เชียงใหม่')
    assert.equal(out.district, undefined)
    assert.deepEqual(out.errors, [])
  })

  it('canonicalizes an English province to the Thai name_th', () => {
    assert.equal(canonicalizeProvinceDistrict('Chiang Mai', '').province, 'เชียงใหม่')
    assert.equal(canonicalizeProvinceDistrict('bangkok', '').province, 'กรุงเทพมหานคร')
  })

  it('accepts the จังหวัด prefix on the province', () => {
    assert.equal(canonicalizeProvinceDistrict('จังหวัดเชียงใหม่', '').province, 'เชียงใหม่')
  })

  it('stores a Bangkok district without the เขต prefix, with or without the prefix in input', () => {
    const withPrefix = canonicalizeProvinceDistrict('กรุงเทพมหานคร', 'เขตบางรัก')
    const without = canonicalizeProvinceDistrict('กรุงเทพมหานคร', 'บางรัก')
    assert.equal(withPrefix.district, 'บางรัก')
    assert.equal(without.district, 'บางรัก')
    assert.deepEqual(withPrefix.errors, [])
    assert.deepEqual(without.errors, [])
  })

  it('stores an amphoe without the อำเภอ prefix, with or without the prefix in input', () => {
    assert.equal(canonicalizeProvinceDistrict('เชียงใหม่', 'อำเภอจอมทอง').district, 'จอมทอง')
    assert.equal(canonicalizeProvinceDistrict('เชียงใหม่', 'จอมทอง').district, 'จอมทอง')
  })

  it('matches an English district name', () => {
    assert.equal(canonicalizeProvinceDistrict('Chiang Mai', 'Chom Thong').district, 'จอมทอง')
  })

  it('reports a district error when the province is missing', () => {
    const out = canonicalizeProvinceDistrict('', 'บางรัก')
    assert.equal(out.province, undefined)
    assert.deepEqual(out.errors.map((e) => e.field), ['district'])
  })

  it('reports a province error for an unknown province', () => {
    const out = canonicalizeProvinceDistrict('Atlantis', '')
    assert.equal(out.province, undefined)
    assert.deepEqual(out.errors.map((e) => e.field), ['province'])
  })

  it('reports a district error when the district is not in the province', () => {
    const out = canonicalizeProvinceDistrict('เชียงใหม่', 'บางรัก')
    assert.deepEqual(out.errors.map((e) => e.field), ['district'])
    assert.equal(out.district, undefined)
  })

  it('reports an unknown district in a valid province', () => {
    assert.deepEqual(canonicalizeProvinceDistrict('เชียงใหม่', 'Nowhere').errors.map((e) => e.field), ['district'])
  })
})
