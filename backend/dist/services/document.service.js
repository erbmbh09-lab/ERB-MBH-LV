"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const task_model_1 = require("../models/task.model");
const notification_service_1 = require("./notification.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class DocumentService {
    /**
     * Add documents to task
     */
    static async addDocuments(taskId, userId, documents, workflowStepNumber) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            // Create document comment
            const comment = {
                authorId: userId,
                content: 'تم إضافة مستندات',
                timestamp: new Date().toISOString(),
                attachments: documents,
                workflowStep: workflowStepNumber
            };
            // Update task
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, {
                $push: {
                    comments: comment,
                    auditTrail: {
                        action: 'file-attached',
                        timestamp: new Date().toISOString(),
                        userId,
                        details: {
                            documentCount: documents.length,
                            workflowStep: workflowStepNumber
                        }
                    }
                }
            }, { new: true });
            // Check if documents fulfill court requirements
            if (task.courtInfo?.requiredDocuments?.length) {
                await this.checkCourtDocuments(taskId, documents);
            }
            // Send notifications
            await this.notifyDocumentAddition(task, documents, userId);
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error adding documents:', error);
            throw error;
        }
    }
    /**
     * Check document expiry and send reminders
     */
    static async checkDocumentExpiry(taskId) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            const today = new Date();
            const expiringDocs = task.comments
                ?.flatMap(comment => comment.attachments || [])
                .filter(doc => {
                if (!doc.expiryDate)
                    return false;
                const expiryDate = new Date(doc.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 30;
            });
            if (expiringDocs?.length) {
                // Send expiry notifications
                await notification_service_1.NotificationService.createTaskNotification(taskId, task.assigneeId, 'تنبيه انتهاء صلاحية المستندات', `لديك ${expiringDocs.length} مستند(ات) على وشك انتهاء الصلاحية`);
                // Add reminders
                const reminderUpdates = expiringDocs.map(doc => ({
                    type: 'notification',
                    beforeDue: 7 * 24 * 60, // 7 days before expiry
                    message: `المستند ${doc.fileName} سينتهي في ${doc.expiryDate}`
                }));
                await task_model_1.Task.findByIdAndUpdate(taskId, {
                    $push: { reminders: { $each: reminderUpdates } }
                });
            }
            return expiringDocs;
        }
        catch (error) {
            logger_1.logger.error('Error checking document expiry:', error);
            throw error;
        }
    }
    /**
     * Validate required court documents
     */
    static async checkCourtDocuments(taskId, documents) {
        const task = await task_model_1.Task.findById(taskId);
        if (!task?.courtInfo?.requiredDocuments)
            return;
        const requiredDocs = new Set(task.courtInfo.requiredDocuments);
        const submittedDocs = new Set(documents.map(d => d.category));
        const missingDocs = [...requiredDocs].filter(doc => !submittedDocs.has(doc));
        if (missingDocs.length > 0) {
            await notification_service_1.NotificationService.createTaskNotification(taskId, task.assigneeId, 'مستندات مطلوبة ناقصة', `لا تزال المستندات التالية مطلوبة: ${missingDocs.join(', ')}`);
        }
    }
    /**
     * Send document notifications
     */
    static async notifyDocumentAddition(task, documents, userId) {
        // Notify task owner
        if (task.assigneeId !== userId) {
            await notification_service_1.NotificationService.createTaskNotification(task._id, task.assigneeId, 'مستندات جديدة', `تم إضافة ${documents.length} مستند(ات) جديدة للمهمة`);
        }
        // Notify workflow approvers if in review
        if (task.status === 'pending-approval' && task.workflow?.sequence) {
            const currentStep = task.workflow.sequence[task.workflow.currentStep - 1];
            if (currentStep && currentStep.assigneeId !== userId) {
                await notification_service_1.NotificationService.createTaskNotification(task._id, currentStep.assigneeId, 'مستندات جديدة للمراجعة', `تم إضافة ${documents.length} مستند(ات) جديدة تحتاج للمراجعة`);
            }
        }
    }
}
exports.DocumentService = DocumentService;
//# sourceMappingURL=document.service.js.map