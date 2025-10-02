import { SystemLog, AuditEntry } from '../interfaces/shared.interfaces';
import { logger } from '../utils/logger';

export class SystemLogger {
  /**
   * Log system activity
   */
  static async logActivity(params: {
    userId: number;
    userType: 'Employee' | 'Client';
    action: string;
    module: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SystemLog> {
    try {
      const log: SystemLog = {
        id: generateLogId(),
        timestamp: new Date().toISOString(),
        ...params
      };

      // Here you would typically save to database
      // For now, we'll just use the logger
      logger.info('System Activity:', log);

      return log;
    } catch (error) {
      logger.error('Error logging system activity:', error);
      throw error;
    }
  }

  /**
   * Create audit entry
   */
  static async createAuditEntry(params: {
    userId: number;
    action: string;
    details?: Record<string, any>;
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
    };
  }): Promise<AuditEntry> {
    try {
      const entry: AuditEntry = {
        action: params.action,
        timestamp: new Date().toISOString(),
        userId: params.userId,
        details: params.details,
        metadata: params.metadata
      };

      // Here you would typically save to database
      // For now, we'll just use the logger
      logger.info('Audit Entry:', entry);

      return entry;
    } catch (error) {
      logger.error('Error creating audit entry:', error);
      throw error;
    }
  }

  /**
   * Log API request
   */
  static async logApiRequest(params: {
    userId: number;
    method: string;
    path: string;
    query?: any;
    body?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const logEntry = {
        type: 'API_REQUEST',
        timestamp: new Date().toISOString(),
        ...params
      };

      logger.info('API Request:', logEntry);
    } catch (error) {
      logger.error('Error logging API request:', error);
      // Don't throw error as this is non-critical
    }
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(params: {
    userId: number;
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const logEntry = {
        type: 'SECURITY_EVENT',
        timestamp: new Date().toISOString(),
        ...params
      };

      logger.warn('Security Event:', logEntry);

      // For critical events, you might want to trigger additional notifications
      if (params.severity === 'critical') {
        // Implement notification logic here
      }
    } catch (error) {
      logger.error('Error logging security event:', error);
      throw error;
    }
  }
}

// Helper function to generate log ID
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}