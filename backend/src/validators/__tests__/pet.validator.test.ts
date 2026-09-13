import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateCreatePetInput, validateUpdatePetInput } from '../pet.validator.js'
import { AppError } from '../../utils/errors.js'

describe('Pet Validator', () => {
  it('should successfully validate a pet with all fields', () => {
    const input = {
      name: 'Milo',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 2,
      gender: 'Male',
      weight: 25.5,
      allergy: 'Chicken',
      notes: 'Loves belly rubs',
      photo: 'https://example.com/milo.jpg',
    }

    const result = validateCreatePetInput(input)
    assert.equal(result.name, 'Milo')
    assert.equal(result.species, 'Dog')
    assert.equal(result.breed, 'Golden Retriever')
    assert.equal(result.age, 2)
    assert(result.b_date instanceof Date)
    assert.equal(result.gender, 'Male')
    assert.equal(result.weight, 25.5)
    assert.equal(result.allergy, 'Chicken')
    assert.equal(result.photo, 'https://example.com/milo.jpg')
  })

  it('should successfully validate with minimal required fields', () => {
    const input = {
      name: 'Luna',
    }

    const result = validateCreatePetInput(input)
    assert.equal(result.name, 'Luna')
    assert.equal(result.species, null)
    assert.equal(result.breed, null)
    assert.equal(result.age, null)
    assert.equal(result.b_date, null)
    assert.equal(result.gender, null)
    assert.equal(result.weight, null)
    assert.equal(result.image_url, null)
  })

  it('should throw AppError when name is missing', () => {
    assert.throws(
      () => {
        validateCreatePetInput({})
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const nameErr = err.errors?.find((e) => e.field === 'name')
        assert(nameErr !== undefined)
        return true
      }
    )
  })

  it('should throw AppError when name exceeds 50 characters', () => {
    assert.throws(
      () => {
        validateCreatePetInput({ name: 'A'.repeat(51) })
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        assert.equal(err.errorCode, 'VALIDATION_ERROR')
        const nameErr = err.errors?.find((e) => e.field === 'name')
        assert(nameErr !== undefined)
        return true
      }
    )
  })

  it('should parse b_date and compute age accurately', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 3)
    const dateStr = birthDate.toISOString().split('T')[0]

    const result = validateCreatePetInput({
      name: 'Coco',
      b_date: dateStr,
    })

    assert.equal(result.name, 'Coco')
    assert.equal(result.age, 3)
    assert(result.b_date instanceof Date)
  })

  it('should throw AppError when b_date is in the future', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    assert.throws(
      () => {
        validateCreatePetInput({
          name: 'FutureDog',
          b_date: futureDate.toISOString(),
        })
      },
      (err: unknown) => {
        assert(err instanceof AppError)
        const dateErr = err.errors?.find((e) => e.field === 'b_date')
        assert(dateErr !== undefined)
        return true
      }
    )
  })

  it('should map notes to allergy and photo to image_url', () => {
    const result = validateCreatePetInput({
      name: 'Bella',
      notes: 'Allergic to peanuts',
      photo: 'https://example.com/bella.png',
    })

    assert.equal(result.allergy, 'Allergic to peanuts')
    assert.equal(result.notes, 'Allergic to peanuts')
    assert.equal(result.image_url, 'https://example.com/bella.png')
    assert.equal(result.photo, 'https://example.com/bella.png')
  })

  describe('validateUpdatePetInput', () => {
    it('should successfully validate partial update without name', () => {
      const result = validateUpdatePetInput({
        weight: 30.2,
        notes: 'Updated notes',
      })

      assert.equal(result.name, undefined)
      assert.equal(result.weight, 30.2)
      assert.equal(result.notes, 'Updated notes')
      assert.equal(result.allergy, 'Updated notes')
    })

    it('should successfully validate update with valid name', () => {
      const result = validateUpdatePetInput({
        name: 'Mochi 2',
      })

      assert.equal(result.name, 'Mochi 2')
    })

    it('should throw AppError when updating name to empty string', () => {
      assert.throws(
        () => {
          validateUpdatePetInput({ name: '   ' })
        },
        (err: unknown) => {
          assert(err instanceof AppError)
          assert.equal(err.errorCode, 'VALIDATION_ERROR')
          const nameErr = err.errors?.find((e) => e.field === 'name')
          assert(nameErr !== undefined)
          return true
        }
      )
    })

    it('should throw AppError when updating name exceeding 50 characters', () => {
      assert.throws(
        () => {
          validateUpdatePetInput({ name: 'A'.repeat(51) })
        },
        (err: unknown) => {
          assert(err instanceof AppError)
          assert.equal(err.errorCode, 'VALIDATION_ERROR')
          const nameErr = err.errors?.find((e) => e.field === 'name')
          assert(nameErr !== undefined)
          return true
        }
      )
    })

    it('should set b_date and age to null when clearing birthday during update', () => {
      const result = validateUpdatePetInput({
        birthday: null,
      })

      assert.strictEqual(result.b_date, null)
      assert.strictEqual(result.age, null)
    })
  })
})

