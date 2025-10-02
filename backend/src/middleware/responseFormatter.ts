import { Request, Response, NextFunction } from 'express';
import { BaseResponse } from '../interfaces/shared.interfaces';
import { logger } from '../utils/logger';

export const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  // Store the original res.json function
  const originalJson = res.json;

  // Override res.json to format the response
  res.json = function(data: any): Response {
    let formattedResponse: BaseResponse<any>;

    // Check if the response is already formatted
    if (data?.status && (data?.data || data?.error)) {
      formattedResponse = data;
    } else {
      formattedResponse = {
        status: 'success',
        data
      };
    }

    // Add pagination meta if available
    if (data?.meta?.pagination) {
      formattedResponse.meta = data.meta;
    }

    // Log the response for monitoring
    logger.debug('API Response:', {
      path: req.path,
      method: req.method,
      status: formattedResponse.status,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, formattedResponse);
  };

  next();
};

export const errorFormatter = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  const formattedError: BaseResponse<null> = {
    status: 'error',
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'حدث خطأ داخلي في النظام',
      details: error.details || undefined
    }
  };

  res.status(error.status || 500).json(formattedError);
};