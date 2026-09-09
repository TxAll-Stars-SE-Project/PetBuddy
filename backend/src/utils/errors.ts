export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public errors?: { field: string; message: string }[]
  ) {
    super(message)
    this.name = 'AppError'
  }
}
