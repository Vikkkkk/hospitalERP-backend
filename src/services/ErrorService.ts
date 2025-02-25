import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './LoggerService';

// 🌐 Global Error Handler Middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  LoggerService.error(`❌ Error occurred: ${err.message} | Method: ${req.method} | URL: ${req.originalUrl} | Stack: ${err.stack}`);

  res.status(500).json({
    message: '服务器内部错误，请稍后重试。',
  });

  next(); // Passes the error to the next middleware (if needed)
};
