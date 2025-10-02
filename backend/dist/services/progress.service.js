"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const task_model_1 = require("../models/task.model");
const notification_service_1 = require("./notification.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class ProgressService {
    /**
     * Update task progress
     */
    static async updateProgress({ taskId, progress, userId, notes }) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            // Validate progress value
            if (progress < 0 || progress > 100) {
                throw new errorHandler_1.APIError('نسبة التقدم يجب أن تكون بين 0 و 100', 400);
            }
            // Calculate significant progress change
            const isSignificantChange = Math.abs(task.progress - progress) >= 20;
            // Update task progress
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, {
                $set: { progress },
                $push: {
                    auditTrail: {
                        action: 'progress-updated',
                        timestamp: new Date().toISOString(),
                        userId,
                        details: {
                            oldProgress: task.progress,
                            newProgress: progress,
                            notes
                        }
                    }
                }
            }, { new: true });
            // Update milestone status if needed
            await this.updateMilestones(taskId);
            // Send notifications for significant changes
            if (isSignificantChange) {
                await this.notifyProgressChange(task, progress);
            }
            // Check if task is nearly complete
            if (progress >= 90 && task.progress < 90) {
                await this.notifyNearCompletion(task);
            }
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error updating progress:', error);
            throw error;
        }
    }
    /**
     * Update milestone statuses
     */
    static async updateMilestones(taskId) {
        const task = await task_model_1.Task.findById(taskId);
        if (!task?.milestones)
            return;
        const now = new Date();
        const updatedMilestones = task.milestones.map(milestone => {
            const dueDate = new Date(milestone.dueDate);
            // Update overdue status
            if (milestone.status === 'pending' && dueDate < now) {
                return { ...milestone, status: 'overdue' };
            }
            return milestone;
        });
        await task_model_1.Task.findByIdAndUpdate(taskId, {
            $set: { milestones: updatedMilestones }
        });
    }
    /**
     * Calculate estimated completion date
     */
    static async calculateEstimatedCompletion(taskId) {
        const task = await task_model_1.Task.findById(taskId);
        if (!task)
            return null;
        const progressHistory = task.auditTrail
            .filter((entry) => entry.action === 'progress-updated')
            .map((entry) => ({
            timestamp: new Date(entry.timestamp),
            progress: entry.details.newProgress
        }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        if (progressHistory.length < 2)
            return null;
        // Calculate average daily progress
        const daysBetween = (progressHistory[progressHistory.length - 1].timestamp.getTime() -
            progressHistory[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const progressDiff = progressHistory[progressHistory.length - 1].progress -
            progressHistory[0].progress;
        const dailyProgress = progressDiff / daysBetween;
        if (dailyProgress <= 0)
            return null;
        // Calculate remaining days
        const remainingProgress = 100 - task.progress;
        const remainingDays = remainingProgress / dailyProgress;
        // Calculate estimated completion date
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(remainingDays));
        return estimatedCompletion;
    }
    /**
     * Send notifications
     */
    static async notifyProgressChange(task, newProgress) {
        const message = `تم تحديث نسبة إنجاز المهمة "${task.title}" إلى ${newProgress}%`;
        // Notify task assigner
        await notification_service_1.NotificationService.createTaskNotification(task._id, task.assignerId, 'تحديث تقدم المهمة', message);
        // Notify workflow approvers if in review
        if (task.status === 'pending-approval' && task.workflow?.sequence) {
            const currentStep = task.workflow.sequence[task.workflow.currentStep - 1];
            if (currentStep) {
                await notification_service_1.NotificationService.createTaskNotification(task._id, currentStep.assigneeId, 'تحديث تقدم المهمة قيد المراجعة', message);
            }
        }
    }
    static async notifyNearCompletion(task) {
        const message = `المهمة "${task.title}" على وشك الاكتمال`;
        await notification_service_1.NotificationService.createTaskNotification(task._id, task.assignerId, 'المهمة على وشك الاكتمال', message);
    }
}
exports.ProgressService = ProgressService;
//# sourceMappingURL=progress.service.js.map