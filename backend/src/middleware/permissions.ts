import { Request, Response, NextFunction } from 'express';
import { SystemLogger } from '../services/system-logger.service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    employeeId: number;
    userType: 'Employee' | 'Client';
    permissions: Set<string>;
  };
}

export const checkPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has required permission
      if (!user.permissions.has(requiredPermission)) {
        // Log security event
        await SystemLogger.logSecurityEvent({
          userId: user.employeeId,
          event: 'PERMISSION_DENIED',
          severity: 'medium',
          details: {
            requiredPermission,
            path: req.path,
            method: req.method
          },
          ipAddress: req.ip
        });

        return res.status(403).json({
          status: 'error',
          error: {
            code: 'PERMISSION_DENIED',
            message: 'ليس لديك صلاحية للقيام بهذا الإجراء'
          }
        });
      }

      // Log successful permission check
      await SystemLogger.logApiRequest({
        userId: user.employeeId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      next();
    } catch (error) {
      logger.error('Error checking permissions:', error);
      next(error);
    }
  };
};

export const requiresAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        user.permissions.has(permission)
      );

      if (!hasPermission) {
        // Log security event
        await SystemLogger.logSecurityEvent({
          userId: user.employeeId,
          event: 'PERMISSION_DENIED',
          severity: 'medium',
          details: {
            requiredPermissions: permissions,
            path: req.path,
            method: req.method
          },
          ipAddress: req.ip
        });

        return res.status(403).json({
          status: 'error',
          error: {
            code: 'PERMISSION_DENIED',
            message: 'ليس لديك أي من الصلاحيات المطلوبة للقيام بهذا الإجراء'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking permissions:', error);
      next(error);
    }
  };
};

export const requiresAllPermissions = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        user.permissions.has(permission)
      );

      if (!hasAllPermissions) {
        // Log security event
        await SystemLogger.logSecurityEvent({
          userId: user.employeeId,
          event: 'PERMISSION_DENIED',
          severity: 'medium',
          details: {
            requiredPermissions: permissions,
            path: req.path,
            method: req.method
          },
          ipAddress: req.ip
        });

        return res.status(403).json({
          status: 'error',
          error: {
            code: 'PERMISSION_DENIED',
            message: 'يجب أن تمتلك جميع الصلاحيات المطلوبة للقيام بهذا الإجراء'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking permissions:', error);
      next(error);
    }
  };
};