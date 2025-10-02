import { Request, Response } from 'express';
import { BaseResponse, PaginationParams } from '../interfaces/shared.interfaces';
import { SystemLogger } from '../services/system-logger.service';
import { logger } from '../utils/logger';

export abstract class BaseController {
  protected async sendResponse<T>(
    req: Request,
    res: Response,
    data: T,
    meta?: any
  ): Promise<void> {
    const response: BaseResponse<T> = {
      status: 'success',
      data,
      meta
    };

    res.json(response);
  }

  protected async sendPaginatedResponse<T>(
    req: Request,
    res: Response,
    data: T[],
    total: number,
    params: PaginationParams
  ): Promise<void> {
    const totalPages = Math.ceil(total / params.limit);

    const response: BaseResponse<T[]> = {
      status: 'success',
      data,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      }
    };

    res.json(response);
  }

  protected async sendError(
    req: Request,
    res: Response,
    error: any,
    status: number = 500
  ): Promise<void> {
    const errorResponse: BaseResponse<null> = {
      status: 'error',
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'حدث خطأ داخلي في النظام',
        details: error.details
      }
    };

    // Log error
    await SystemLogger.logSecurityEvent({
      userId: (req as any).user?.employeeId,
      event: 'API_ERROR',
      severity: 'high',
      details: {
        path: req.path,
        method: req.method,
        error: errorResponse
      },
      ipAddress: req.ip
    });

    res.status(status).json(errorResponse);
  }

  protected getPaginationParams(req: Request): PaginationParams {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    const search = req.query.search as string;

    // Extract filters from query params
    const filters: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (!['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) {
        filters[key] = value;
      }
    }

    return {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      filters
    };
  }

  protected async logActivity(
    req: Request,
    action: string,
    module: string,
    details: any
  ): Promise<void> {
    try {
      await SystemLogger.logActivity({
        userId: (req as any).user?.employeeId,
        userType: (req as any).user?.userType || 'Employee',
        action,
        module,
        details,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw error as this is non-critical
    }
  }
}