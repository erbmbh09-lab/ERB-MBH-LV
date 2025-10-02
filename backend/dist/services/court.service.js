"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtService = void 0;
const task_model_1 = require("../models/task.model");
const notification_service_1 = require("./notification.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class CourtService {
    /**
     * Link task to court case
     */
    static async linkToCourtCase(taskId, courtInfo, userId) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            // Update task with court info
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, {
                $set: { courtInfo },
                $push: {
                    auditTrail: {
                        action: 'court-info-added',
                        timestamp: new Date().toISOString(),
                        userId,
                        details: courtInfo
                    }
                }
            }, { new: true });
            // Set up reminders for court dates
            if (courtInfo.hearingDate) {
                await this.setupCourtDateReminders(taskId, courtInfo);
            }
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error linking to court case:', error);
            throw error;
        }
    }
    /**
     * Update court hearing date
     */
    static async updateHearingDate(taskId, hearingDate, userId) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            if (!task.courtInfo) {
                throw new errorHandler_1.APIError('لا توجد معلومات محكمة مرتبطة', 400);
            }
            // Update hearing date
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, {
                $set: { 'courtInfo.hearingDate': hearingDate },
                $push: {
                    auditTrail: {
                        action: 'hearing-date-updated',
                        timestamp: new Date().toISOString(),
                        userId,
                        details: { oldDate: task.courtInfo.hearingDate, newDate: hearingDate }
                    }
                }
            }, { new: true });
            // Update reminders
            await this.setupCourtDateReminders(taskId, {
                ...task.courtInfo,
                hearingDate
            });
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error updating hearing date:', error);
            throw error;
        }
    }
    /**
     * Update required documents
     */
    static async updateRequiredDocuments(taskId, documents, userId) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, {
                $set: { 'courtInfo.requiredDocuments': documents },
                $push: {
                    auditTrail: {
                        action: 'documents-updated',
                        timestamp: new Date().toISOString(),
                        userId,
                        details: { documents }
                    }
                }
            }, { new: true });
            // Notify assignee about document requirements
            if (documents.length > 0) {
                await notification_service_1.NotificationService.createTaskNotification(taskId, task.assigneeId, 'تحديث المستندات المطلوبة', `تم تحديث قائمة المستندات المطلوبة للقضية ${task.courtInfo?.caseNumber}`);
            }
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error updating required documents:', error);
            throw error;
        }
    }
    /**
     * Setup reminders for court dates
     */
    static async setupCourtDateReminders(taskId, courtInfo) {
        const hearingDate = new Date(courtInfo.hearingDate);
        const reminders = [
            { days: 7, type: 'email' },
            { days: 3, type: 'email' },
            { days: 1, type: 'email' },
            { hours: 24, type: 'notification' },
            { hours: 2, type: 'sms' }
        ];
        // Create reminders
        const reminderUpdates = reminders.map(reminder => ({
            type: reminder.type,
            beforeDue: reminder.days ? reminder.days * 24 * 60 : reminder.hours * 60,
            message: `تذكير: جلسة محكمة للقضية ${courtInfo.caseNumber} في ${courtInfo.courtName}`
        }));
        await task_model_1.Task.findByIdAndUpdate(taskId, {
            $push: { reminders: { $each: reminderUpdates } }
        });
    }
}
exports.CourtService = CourtService;
//# sourceMappingURL=court.service.js.map