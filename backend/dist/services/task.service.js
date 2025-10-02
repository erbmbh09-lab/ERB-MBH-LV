"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const task_model_1 = require("../models/task.model");
const notification_service_1 = require("./notification.service");
const logger_1 = require("../utils/logger");
class TaskService {
    static async assignTask(assignerId, assigneeId, taskData) {
        try {
            // Create task
            const task = await task_model_1.Task.create({
                ...taskData,
                assignerId,
                assigneeId,
                status: 'new',
                createdAt: new Date().toISOString()
            });
            // Create notification for assignee
            await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), assigneeId, 'مهمة جديدة', `تم تكليفك بمهمة جديدة: ${taskData.title}`);
            return task;
        }
        catch (error) {
            logger_1.logger.error('Error assigning task:', error);
            throw error;
        }
    }
    static async updateTaskStatus(taskId, status, userId, notes) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }
            // Validate status transition
            if (!this.isValidStatusTransition(task.status, status, userId, task)) {
                throw new Error('Invalid status transition');
            }
            const update = { status };
            // Handle completion
            if (status === 'completed') {
                update.completedAt = new Date().toISOString();
            }
            // Handle approval workflow
            if (status === 'pending-approval') {
                if (!task.approvalWorkflow) {
                    task.approvalWorkflow = [];
                }
                task.approvalWorkflow.push({
                    approverId: userId,
                    status: 'pending',
                    notes
                });
            }
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, { $set: update }, { new: true });
            // Create notifications based on status change
            await this.createStatusChangeNotifications(task, status, userId);
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error updating task status:', error);
            throw error;
        }
    }
    static isValidStatusTransition(currentStatus, newStatus, userId, task) {
        // Only assignee can mark as in-progress or completed
        if (['in-progress', 'completed'].includes(newStatus) && task.assigneeId !== userId) {
            return false;
        }
        // Only assigner can approve or reject
        if (['approved', 'rejected'].includes(newStatus) && task.assignerId !== userId) {
            return false;
        }
        // Status transition rules
        const allowedTransitions = {
            'new': ['in-progress', 'rejected'],
            'in-progress': ['completed', 'rejected'],
            'completed': ['pending-approval'],
            'pending-approval': ['approved', 'rejected'],
            'rejected': ['in-progress']
        };
        return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }
    static async createStatusChangeNotifications(task, newStatus, userId) {
        const notificationData = {
            taskId: task._id.toString(),
            title: ''
        };
        switch (newStatus) {
            case 'in-progress':
                notificationData.title = `المهمة "${task.title}" قيد التنفيذ`;
                await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), task.assignerId, notificationData.title, `بدأ ${userId} العمل على المهمة`);
                break;
            case 'completed':
                notificationData.title = `المهمة "${task.title}" مكتملة`;
                await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), task.assignerId, notificationData.title, `أكمل ${userId} المهمة وهي تنتظر المراجعة`);
                break;
            case 'pending-approval':
                notificationData.title = `المهمة "${task.title}" تنتظر الموافقة`;
                await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), task.assignerId, notificationData.title, `المهمة جاهزة للمراجعة والموافقة`);
                break;
            case 'approved':
                notificationData.title = `المهمة "${task.title}" معتمدة`;
                await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), task.assigneeId, notificationData.title, `تمت الموافقة على المهمة`);
                break;
            case 'rejected':
                notificationData.title = `المهمة "${task.title}" مرفوضة`;
                await notification_service_1.NotificationService.createTaskNotification(task._id.toString(), task.assigneeId, notificationData.title, `تم رفض المهمة. يرجى مراجعة التعليقات`);
                break;
        }
    }
    static async addComment(taskId, authorId, content) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }
            const comment = {
                authorId,
                content,
                timestamp: new Date().toISOString()
            };
            // Add comment
            const updatedTask = await task_model_1.Task.findByIdAndUpdate(taskId, { $push: { comments: comment } }, { new: true });
            // Notify relevant users
            const notifyUserId = authorId === task.assigneeId ? task.assignerId : task.assigneeId;
            await notification_service_1.NotificationService.createTaskNotification(taskId, notifyUserId, `تعليق جديد على المهمة "${task.title}"`, content);
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('Error adding comment:', error);
            throw error;
        }
    }
    static async getTasksByUser(userId, filters = {}) {
        try {
            const query = {
                $or: [
                    { assigneeId: userId },
                    { assignerId: userId }
                ]
            };
            // Apply additional filters
            if (filters.status)
                query.status = filters.status;
            if (filters.priority)
                query.priority = filters.priority;
            if (filters.type)
                query.type = filters.type;
            if (filters.relatedCaseId)
                query.relatedCaseId = filters.relatedCaseId;
            const tasks = await task_model_1.Task.find(query).sort({ createdAt: -1 });
            return tasks;
        }
        catch (error) {
            logger_1.logger.error('Error getting tasks by user:', error);
            throw error;
        }
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=task.service.js.map