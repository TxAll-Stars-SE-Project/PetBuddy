export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'other'
  ageInYears: number
  isAdopted: boolean
}

export class PetService {
  private pets: Pet[] = [
    { id: '1', name: 'Buddy', species: 'dog', ageInYears: 3, isAdopted: false },
    { id: '2', name: 'Milo', species: 'cat', ageInYears: 2, isAdopted: true },
    { id: '3', name: 'Bella', species: 'dog', ageInYears: 5, isAdopted: false },
  ]

  public getAllPets(): Pet[] {
    return this.pets
  }

  public getAvailablePets(): Pet[] {
    return this.pets.filter((pet) => !pet.isAdopted)
  }

  public getPetById(id: string): Pet | undefined {
    return this.pets.find((pet) => pet.id === id)
  }

  public adoptPet(id: string): Pet | null {
    const pet = this.getPetById(id)
    if (!pet) {
      return null
    }
    pet.isAdopted = true
    return pet
  }
}
