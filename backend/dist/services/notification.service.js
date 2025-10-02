"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_model_1 = require("../models/notification.model");
const user_model_1 = require("../models/user.model");
const employee_model_1 = require("../models/employee.model");
const logger_1 = require("../utils/logger");
class NotificationService {
    static async createNotification(data) {
        try {
            const notification = await notification_model_1.Notification.create(data);
            logger_1.logger.info(`Created notification: ${notification.id}`);
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error creating notification:', error);
            throw error;
        }
    }
    static async createTaskNotification(taskId, assigneeId, title, content) {
        try {
            const user = await user_model_1.User.findOne({ employeeId: assigneeId });
            if (!user) {
                logger_1.logger.error(`No user found for employee ID: ${assigneeId}`);
                return null;
            }
            return await this.createNotification({
                userId: user._id.toString(),
                employeeId: assigneeId,
                title,
                content,
                type: 'TASK',
                priority: 'high',
                relatedTo: {
                    type: 'task',
                    id: taskId
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating task notification:', error);
            throw error;
        }
    }
    static async createDeadlineNotification(caseId, employeeId, title, content, expiresAt) {
        try {
            const user = await user_model_1.User.findOne({ employeeId });
            if (!user) {
                logger_1.logger.error(`No user found for employee ID: ${employeeId}`);
                return null;
            }
            return await this.createNotification({
                userId: user._id.toString(),
                employeeId,
                title,
                content,
                type: 'DEADLINE',
                priority: 'urgent',
                relatedTo: {
                    type: 'case',
                    id: caseId
                },
                expiresAt
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating deadline notification:', error);
            throw error;
        }
    }
    static async createDocumentExpiryNotification(documentType, employeeId, expiryDate) {
        try {
            const user = await user_model_1.User.findOne({ employeeId });
            if (!user) {
                logger_1.logger.error(`No user found for employee ID: ${employeeId}`);
                return null;
            }
            const employee = await employee_model_1.Employee.findOne({ id: employeeId });
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            return await this.createNotification({
                userId: user._id.toString(),
                employeeId,
                title: `${documentType} Expiry Warning`,
                content: `Your ${documentType} will expire in ${daysUntilExpiry} days. Please renew it before ${expiryDate.toLocaleDateString()}.`,
                type: 'DOCUMENT',
                priority: daysUntilExpiry <= 7 ? 'urgent' : 'high',
                relatedTo: {
                    type: 'employee',
                    id: employee._id.toString()
                },
                expiresAt: expiryDate
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating document expiry notification:', error);
            throw error;
        }
    }
    static async createCaseUpdateNotification(caseId, employeeIds, title, content) {
        try {
            const users = await user_model_1.User.find({ employeeId: { $in: employeeIds } });
            const notifications = await Promise.all(users.map(user => this.createNotification({
                userId: user._id.toString(),
                employeeId: user.employeeId,
                title,
                content,
                type: 'CASE',
                priority: 'medium',
                relatedTo: {
                    type: 'case',
                    id: caseId
                }
            })));
            return notifications;
        }
        catch (error) {
            logger_1.logger.error('Error creating case update notifications:', error);
            throw error;
        }
    }
    static async getUnreadNotifications(userId) {
        try {
            return await notification_model_1.Notification.find({
                userId,
                status: 'unread'
            }).sort({ createdAt: -1 });
        }
        catch (error) {
            logger_1.logger.error('Error getting unread notifications:', error);
            throw error;
        }
    }
    static async markAsRead(notificationId, userId) {
        try {
            const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, {
                $set: {
                    status: 'read',
                    readAt: new Date()
                }
            }, { new: true });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error marking notification as read:', error);
            throw error;
        }
    }
    static async markAllAsRead(userId) {
        try {
            const result = await notification_model_1.Notification.updateMany({ userId, status: 'unread' }, {
                $set: {
                    status: 'read',
                    readAt: new Date()
                }
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    static async archiveNotification(notificationId, userId) {
        try {
            const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, { $set: { status: 'archived' } }, { new: true });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error archiving notification:', error);
            throw error;
        }
    }
    static async deleteExpiredNotifications() {
        try {
            const result = await notification_model_1.Notification.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            logger_1.logger.info(`Deleted ${result.deletedCount} expired notifications`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error deleting expired notifications:', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map