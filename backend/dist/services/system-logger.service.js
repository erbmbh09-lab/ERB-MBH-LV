"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogger = void 0;
const logger_1 = require("../utils/logger");
class SystemLogger {
    /**
     * Log system activity
     */
    static async logActivity(params) {
        try {
            const log = {
                id: generateLogId(),
                timestamp: new Date().toISOString(),
                ...params
            };
            // Here you would typically save to database
            // For now, we'll just use the logger
            logger_1.logger.info('System Activity:', log);
            return log;
        }
        catch (error) {
            logger_1.logger.error('Error logging system activity:', error);
            throw error;
        }
    }
    /**
     * Create audit entry
     */
    static async createAuditEntry(params) {
        try {
            const entry = {
                action: params.action,
                timestamp: new Date().toISOString(),
                userId: params.userId,
                details: params.details,
                metadata: params.metadata
            };
            // Here you would typically save to database
            // For now, we'll just use the logger
            logger_1.logger.info('Audit Entry:', entry);
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Error creating audit entry:', error);
            throw error;
        }
    }
    /**
     * Log API request
     */
    static async logApiRequest(params) {
        try {
            const logEntry = {
                type: 'API_REQUEST',
                timestamp: new Date().toISOString(),
                ...params
            };
            logger_1.logger.info('API Request:', logEntry);
        }
        catch (error) {
            logger_1.logger.error('Error logging API request:', error);
            // Don't throw error as this is non-critical
        }
    }
    /**
     * Log security event
     */
    static async logSecurityEvent(params) {
        try {
            const logEntry = {
                type: 'SECURITY_EVENT',
                timestamp: new Date().toISOString(),
                ...params
            };
            logger_1.logger.warn('Security Event:', logEntry);
            // For critical events, you might want to trigger additional notifications
            if (params.severity === 'critical') {
                // Implement notification logic here
            }
        }
        catch (error) {
            logger_1.logger.error('Error logging security event:', error);
            throw error;
        }
    }
}
exports.SystemLogger = SystemLogger;
// Helper function to generate log ID
function generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=system-logger.service.js.map