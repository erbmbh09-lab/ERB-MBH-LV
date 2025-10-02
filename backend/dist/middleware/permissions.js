"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiresAllPermissions = exports.requiresAnyPermission = exports.checkPermission = void 0;
const system_logger_service_1 = require("../services/system-logger.service");
const logger_1 = require("../utils/logger");
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Error('User not authenticated');
            }
            // Check if user has required permission
            if (!user.permissions.has(requiredPermission)) {
                // Log security event
                await system_logger_service_1.SystemLogger.logSecurityEvent({
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
            await system_logger_service_1.SystemLogger.logApiRequest({
                userId: user.employeeId,
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.body,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Error checking permissions:', error);
            next(error);
        }
    };
};
exports.checkPermission = checkPermission;
const requiresAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Error('User not authenticated');
            }
            // Check if user has any of the required permissions
            const hasPermission = permissions.some(permission => user.permissions.has(permission));
            if (!hasPermission) {
                // Log security event
                await system_logger_service_1.SystemLogger.logSecurityEvent({
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
        }
        catch (error) {
            logger_1.logger.error('Error checking permissions:', error);
            next(error);
        }
    };
};
exports.requiresAnyPermission = requiresAnyPermission;
const requiresAllPermissions = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Error('User not authenticated');
            }
            // Check if user has all required permissions
            const hasAllPermissions = permissions.every(permission => user.permissions.has(permission));
            if (!hasAllPermissions) {
                // Log security event
                await system_logger_service_1.SystemLogger.logSecurityEvent({
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
        }
        catch (error) {
            logger_1.logger.error('Error checking permissions:', error);
            next(error);
        }
    };
};
exports.requiresAllPermissions = requiresAllPermissions;
//# sourceMappingURL=permissions.js.map