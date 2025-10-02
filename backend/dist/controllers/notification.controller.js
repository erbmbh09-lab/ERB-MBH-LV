"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const notification_service_1 = require("../services/notification.service");
const logger_1 = require("../utils/logger");
const getNotifications = async (req, res) => {
    try {
        const notifications = await notification_service_1.NotificationService.getUnreadNotifications(req.user._id);
        res.json({
            status: 'success',
            data: { notifications }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting notifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await notification_service_1.NotificationService.markAsRead(notificationId, req.user._id);
        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Notification not found'
            });
        }
        res.json({
            status: 'success',
            data: { notification }
        });
    }
    catch (error) {
        logger_1.logger.error('Error marking notification as read:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await notification_service_1.NotificationService.markAllAsRead(req.user._id);
        res.json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    }
    catch (error) {
        logger_1.logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.markAllAsRead = markAllAsRead;
const archiveNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await notification_service_1.NotificationService.archiveNotification(notificationId, req.user._id);
        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Notification not found'
            });
        }
        res.json({
            status: 'success',
            data: { notification }
        });
    }
    catch (error) {
        logger_1.logger.error('Error archiving notification:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.archiveNotification = archiveNotification;
//# sourceMappingURL=notification.controller.js.map