import { Request, Response, NextFunction } from 'express';

/**
 * 🛠️ Centralized Error Handling Middleware
 */
export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error for debugging
  console.error('❌ Error:', err.stack || err.message);

  // Determine status code (default to 500)
  const statusCode = err.status || 500;

  // Ensure error details are only revealed in development
  const responsePayload =
    process.env.NODE_ENV === 'development'
      ? { message: err.message, stack: err.stack }
      : { message: '服务器内部错误，请稍后再试。' };

  res.status(statusCode).json(responsePayload);
};
