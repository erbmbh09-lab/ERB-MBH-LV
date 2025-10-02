"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const system_logger_service_1 = require("../services/system-logger.service");
const logger_1 = require("../utils/logger");
class BaseController {
    async sendResponse(req, res, data, meta) {
        const response = {
            status: 'success',
            data,
            meta
        };
        res.json(response);
    }
    async sendPaginatedResponse(req, res, data, total, params) {
        const totalPages = Math.ceil(total / params.limit);
        const response = {
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
    async sendError(req, res, error, status = 500) {
        const errorResponse = {
            status: 'error',
            error: {
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'حدث خطأ داخلي في النظام',
                details: error.details
            }
        };
        // Log error
        await system_logger_service_1.SystemLogger.logSecurityEvent({
            userId: req.user?.employeeId,
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
    getPaginationParams(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder;
        const search = req.query.search;
        // Extract filters from query params
        const filters = {};
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
    async logActivity(req, action, module, details) {
        try {
            await system_logger_service_1.SystemLogger.logActivity({
                userId: req.user?.employeeId,
                userType: req.user?.userType || 'Employee',
                action,
                module,
                details,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        }
        catch (error) {
            logger_1.logger.error('Error logging activity:', error);
            // Don't throw error as this is non-critical
        }
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=base.controller.js.map