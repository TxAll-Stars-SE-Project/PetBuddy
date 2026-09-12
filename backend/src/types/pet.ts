export interface CreatePetInput {
  name: string
  species?: string | null
  breed?: string | null
  age?: number | null
  b_date?: Date | null
  gender?: string | null
  weight?: number | null
  allergy?: string | null
  notes?: string | null
  photo?: string | null
  image_url?: string | null
}

export interface PetResponse {
  id: string
  petid: number
  ownerId: string
  ownerid: number
  name: string
  species: string | null
  breed: string | null
  age: number | null
  b_date: string | null
  gender: string | null
  weight: number | null
  notes: string | null
  allergy: string | null
  photo: string | null
  image_url: string | null
}
