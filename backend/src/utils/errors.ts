import { ValidationError } from "../types/user.js"

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public errors?: ValidationError[]
  ) {
    super(message)
    this.name = 'AppError'
  }
}
