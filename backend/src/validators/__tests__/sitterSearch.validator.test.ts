import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateSitterSearchQuery, SORT_OPTIONS } from '../sitterSearch.validator.js'
import { AppError } from '../../utils/errors.js'

// เรียก validator แล้วคืน error list (ล้มเหลวถ้าไม่ throw)
const errorsOf = (query: unknown) => {
  try {
    validateSitterSearchQuery(query)
  } catch (e) {
    assert.ok(e instanceof AppError, 'expected AppError')
    return e.errors ?? []
  }
  assert.fail('expected validateSitterSearchQuery to throw')
}

const fieldsOf = (query: unknown) => errorsOf(query).map((e) => e.field)

describe('validateSitterSearchQuery — defaults', () => {
  it('empty query falls back to sort=rating, page=1, limit=12 and no filters', () => {
    const out = validateSitterSearchQuery({})
    assert.deepEqual(out, {
      q: undefined,
      province: undefined,
      district: undefined,
      petType: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sort: 'rating',
      page: 1,
      limit: 12,
    })
  })

  it('null / undefined query is treated as empty', () => {
    assert.equal(validateSitterSearchQuery(undefined).sort, 'rating')
    assert.equal(validateSitterSearchQuery(null).page, 1)
  })

  it('unknown params are ignored', () => {
    const out = validateSitterSearchQuery({ foo: 'bar', category: 'walking' })
    assert.equal(out.category, 'walking')
    assert.ok(!('foo' in out))
  })

  it('blank params are treated as not sent', () => {
    const out = validateSitterSearchQuery({
      q: '   ', category: '', petType: ' ', minPrice: '', maxPrice: '', minRating: '', sort: '', page: '', limit: '', province: '', district: '',
    })
    assert.equal(out.q, undefined)
    assert.equal(out.category, undefined)
    assert.equal(out.petType, undefined)
    assert.equal(out.minPrice, undefined)
    assert.equal(out.maxPrice, undefined)
    assert.equal(out.minRating, undefined)
    assert.equal(out.sort, 'rating')
    assert.equal(out.page, 1)
    assert.equal(out.limit, 12)
  })
})

describe('validateSitterSearchQuery — category (service type)', () => {
  for (const c of ['walking', 'sitting', 'boarding', 'grooming', 'daycare']) {
    it(`accepts ${c}`, () => assert.equal(validateSitterSearchQuery({ category: c }).category, c))
  }
  it('rejects an unknown category', () => {
    assert.deepEqual(fieldsOf({ category: 'flying' }), ['category'])
  })
  it('is case-sensitive', () => {
    assert.deepEqual(fieldsOf({ category: 'Walking' }), ['category'])
  })
})

describe('validateSitterSearchQuery — petType', () => {
  for (const p of ['dog', 'cat', 'bird', 'exotic']) {
    it(`accepts ${p}`, () => assert.equal(validateSitterSearchQuery({ petType: p }).petType, p))
  }
  it('rejects an unknown petType', () => {
    assert.deepEqual(fieldsOf({ petType: 'dragon' }), ['petType'])
  })
})

describe('validateSitterSearchQuery — price range', () => {
  it('accepts 0 and 1,000,000 as bounds', () => {
    const out = validateSitterSearchQuery({ minPrice: '0', maxPrice: '1000000' })
    assert.equal(out.minPrice, 0)
    assert.equal(out.maxPrice, 1_000_000)
  })
  it('accepts minPrice equal to maxPrice', () => {
    const out = validateSitterSearchQuery({ minPrice: '300', maxPrice: '300' })
    assert.equal(out.minPrice, 300)
    assert.equal(out.maxPrice, 300)
  })
  it('accepts only one side of the range', () => {
    assert.equal(validateSitterSearchQuery({ minPrice: '100' }).maxPrice, undefined)
    assert.equal(validateSitterSearchQuery({ maxPrice: '100' }).minPrice, undefined)
  })
  it('rejects minPrice greater than maxPrice', () => {
    const errs = errorsOf({ minPrice: '500', maxPrice: '100' })
    assert.deepEqual(errs.map((e) => e.field), ['minPrice'])
    assert.match(errs[0].message, /greater than maxPrice/)
  })
  for (const bad of ['-1', 'abc', '1.5', '1e3', '10 0', '+5']) {
    it(`rejects minPrice=${JSON.stringify(bad)}`, () => assert.deepEqual(fieldsOf({ minPrice: bad }), ['minPrice']))
    it(`rejects maxPrice=${JSON.stringify(bad)}`, () => assert.deepEqual(fieldsOf({ maxPrice: bad }), ['maxPrice']))
  }
  it('rejects values above 1,000,000', () => {
    assert.deepEqual(fieldsOf({ minPrice: '1000001' }), ['minPrice'])
    assert.deepEqual(fieldsOf({ maxPrice: '1000001' }), ['maxPrice'])
  })
  it('does not also report min>max when one side is invalid', () => {
    assert.deepEqual(fieldsOf({ minPrice: 'abc', maxPrice: '10' }), ['minPrice'])
  })
})

describe('validateSitterSearchQuery — minRating', () => {
  for (const ok of ['1', '2', '3', '4', '5']) {
    it(`accepts ${ok}`, () => assert.equal(validateSitterSearchQuery({ minRating: ok }).minRating, Number(ok)))
  }
  for (const bad of ['0', '6', '-1', 'abc', '3.5', '1e0', '10']) {
    it(`rejects ${JSON.stringify(bad)}`, () => assert.deepEqual(fieldsOf({ minRating: bad }), ['minRating']))
  }
  it('is optional (no filter when omitted)', () => {
    assert.equal(validateSitterSearchQuery({}).minRating, undefined)
  })
})

describe('validateSitterSearchQuery — sort', () => {
  it('exposes the three documented options', () => {
    assert.deepEqual([...SORT_OPTIONS], ['rating', 'priceAsc', 'priceDesc'])
  })
  for (const s of ['rating', 'priceAsc', 'priceDesc']) {
    it(`accepts ${s}`, () => assert.equal(validateSitterSearchQuery({ sort: s }).sort, s))
  }
  it('defaults to rating', () => assert.equal(validateSitterSearchQuery({}).sort, 'rating'))
  for (const bad of ['price', 'PRICEASC', 'rating desc']) {
    it(`rejects ${JSON.stringify(bad)}`, () => assert.deepEqual(fieldsOf({ sort: bad }), ['sort']))
  }
})

describe('validateSitterSearchQuery — page / limit', () => {
  it('accepts page bounds 1 and 100000', () => {
    assert.equal(validateSitterSearchQuery({ page: '1' }).page, 1)
    assert.equal(validateSitterSearchQuery({ page: '100000' }).page, 100_000)
  })
  it('rejects page 0, negatives, non-numbers and > 100000', () => {
    for (const bad of ['0', '-1', 'abc', '1.5', '100001']) {
      assert.deepEqual(fieldsOf({ page: bad }), ['page'], `page=${bad}`)
    }
  })
  it('accepts limit bounds 1 and 50', () => {
    assert.equal(validateSitterSearchQuery({ limit: '1' }).limit, 1)
    assert.equal(validateSitterSearchQuery({ limit: '50' }).limit, 50)
  })
  it('rejects limit 0, negatives, non-numbers and > 50', () => {
    for (const bad of ['0', '-5', 'abc', '2.5', '51']) {
      assert.deepEqual(fieldsOf({ limit: bad }), ['limit'], `limit=${bad}`)
    }
  })
})

describe('validateSitterSearchQuery — q keyword', () => {
  it('trims whitespace', () => {
    assert.equal(validateSitterSearchQuery({ q: '  hhok  ' }).q, 'hhok')
  })
  it('accepts exactly 100 characters', () => {
    assert.equal(validateSitterSearchQuery({ q: 'a'.repeat(100) }).q?.length, 100)
  })
  it('rejects 101 characters', () => {
    assert.deepEqual(fieldsOf({ q: 'a'.repeat(101) }), ['q'])
  })
  it('measures length after trimming', () => {
    assert.equal(validateSitterSearchQuery({ q: ` ${'a'.repeat(100)} ` }).q?.length, 100)
  })
  it('passes LIKE wildcards through unchanged (escaping happens in the service)', () => {
    assert.equal(validateSitterSearchQuery({ q: '50%_\\' }).q, '50%_\\')
  })
})

describe('validateSitterSearchQuery — area', () => {
  it('canonicalizes a Thai province', () => {
    assert.equal(validateSitterSearchQuery({ province: 'เชียงใหม่' }).province, 'เชียงใหม่')
  })
  it('rejects a district without a province', () => {
    assert.deepEqual(fieldsOf({ district: 'บางรัก' }), ['district'])
  })
  it('rejects an unknown province', () => {
    assert.deepEqual(fieldsOf({ province: 'Atlantis' }), ['province'])
  })
  it('rejects a district that is not in the province', () => {
    assert.deepEqual(fieldsOf({ province: 'เชียงใหม่', district: 'บางรัก' }), ['district'])
  })
})

describe('validateSitterSearchQuery — repeated params (arrays)', () => {
  for (const field of ['q', 'province', 'district', 'petType', 'category', 'minPrice', 'maxPrice', 'minRating', 'sort', 'page', 'limit']) {
    it(`rejects ?${field}=a&${field}=b`, () => {
      assert.ok(fieldsOf({ [field]: ['a', 'b'] }).includes(field))
    })
  }
})

describe('validateSitterSearchQuery — error shape', () => {
  it('throws AppError 400 VALIDATION_ERROR with an errors[] of {field,message}', () => {
    try {
      validateSitterSearchQuery({ category: 'nope', minRating: '9' })
      assert.fail('expected throw')
    } catch (e) {
      assert.ok(e instanceof AppError)
      assert.equal(e.statusCode, 400)
      assert.equal(e.errorCode, 'VALIDATION_ERROR')
      assert.equal(e.message, 'Validation failed')
      assert.ok(Array.isArray(e.errors))
      for (const err of e.errors!) {
        assert.equal(typeof err.field, 'string')
        assert.equal(typeof err.message, 'string')
      }
    }
  })
  it('reports every invalid field at once', () => {
    const fields = fieldsOf({ category: 'nope', petType: 'nope', minRating: '9', sort: 'nope', page: '0', limit: '0' })
    assert.deepEqual(fields.sort(), ['category', 'limit', 'minRating', 'page', 'petType', 'sort'])
  })
})

describe('validateSitterSearchQuery — filters combine', () => {
  it('returns every filter together', () => {
    const out = validateSitterSearchQuery({
      q: 'sit', province: 'เชียงใหม่', petType: 'dog', category: 'boarding',
      minPrice: '100', maxPrice: '900', minRating: '4', sort: 'priceAsc', page: '2', limit: '24',
    })
    assert.deepEqual(out, {
      q: 'sit', province: 'เชียงใหม่', district: undefined, petType: 'dog', category: 'boarding',
      minPrice: 100, maxPrice: 900, minRating: 4, sort: 'priceAsc', page: 2, limit: 24,
    })
  })
})
