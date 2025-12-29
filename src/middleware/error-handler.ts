// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default to 500 internal server error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log the error
  if (isOperational) {
    logger.warn({
      err,
      req: { method: req.method, url: req.url, ip: req.ip },
      statusCode
    }, message);
  } else {
    logger.error({
      err,
      req: { method: req.method, url: req.url, ip: req.ip },
      statusCode
    }, message);
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.url}`,
      statusCode: 404
    }
  });
}

// Async error wrapper to catch promise rejections
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
