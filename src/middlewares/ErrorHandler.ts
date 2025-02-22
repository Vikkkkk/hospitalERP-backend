// backend-api/src/middlewares/errorHandler.js
import { Request, Response, NextFunction } from 'express';
// Global error-handling middleware

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('❌ Error:', err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
  
