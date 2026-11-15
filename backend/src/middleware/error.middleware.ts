import { NextFunction, Request, Response } from 'express'

type HttpError = Error & { status?: number; statusCode?: number; expose?: boolean; type?: string }

// Last-resort error handler. Without it Express renders an HTML page that
// includes the stack trace (when NODE_ENV !== 'production'), leaking file paths
// and internals. This always answers with a short JSON body instead.
export const errorHandler = (err: HttpError, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    next(err)
    return
  }

  const status = err.status ?? err.statusCode ?? 500

  if (status >= 400 && status < 500) {
    // Client errors from body-parser etc. (bad JSON, bad encoding, body too large)
    const code = err.type === 'entity.parse.failed' ? 'INVALID_JSON' : 'BAD_REQUEST'
    res.status(status).json({ error: code, message: err.expose ? err.message : 'Bad request' })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' })
}
