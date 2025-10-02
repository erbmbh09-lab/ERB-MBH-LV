// Custom APIError for service-level errors
export class APIError extends Error {
  status: number;
  details?: any;
  constructor(message: string, status = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
};