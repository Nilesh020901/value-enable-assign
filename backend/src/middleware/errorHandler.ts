import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Never log PII. Safe sanitized system logging
  console.error('[API Error]:', err?.message || 'Unknown Server Error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    errors: err.errors || undefined,
  });
}
