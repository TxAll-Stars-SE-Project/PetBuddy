/**
 * Utility functions for PetBuddy calculations
 */

export interface PetAgeInfo {
  humanAge: number
  petType: 'dog' | 'cat'
}

/**
 * Converts pet age to approximate human years equivalent.
 * @param petAge - Age of the pet in years
 * @param petType - Species of the pet ('dog' or 'cat')
 */
export function calculateHumanAge(petAge: number, petType: 'dog' | 'cat'): number {
  if (petAge < 0) {
    throw new Error('Pet age cannot be negative')
  }

  if (petType === 'dog') {
    if (petAge <= 1) return petAge * 15
    if (petAge <= 2) return 15 + (petAge - 1) * 9
    return 24 + (petAge - 2) * 5
  }

  // Cat age calculation
  if (petAge <= 1) return petAge * 15
  if (petAge <= 2) return 15 + (petAge - 1) * 9
  return 24 + (petAge - 2) * 4
}
