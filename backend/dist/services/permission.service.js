"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const task_model_1 = require("../models/task.model");
const employee_model_1 = require("../models/employee.model");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class PermissionService {
    /**
     * Check if user has permission for specific action
     */
    static async checkPermission({ taskId, userId, action }) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            const employee = await employee_model_1.Employee.findOne({ id: userId });
            if (!employee) {
                throw new errorHandler_1.APIError('المستخدم غير موجود', 404);
            }
            // Check role-based permissions
            if (employee.role === 'admin')
                return true;
            switch (action) {
                case 'view':
                    return this.canViewTask(task, userId);
                case 'edit':
                    return this.canEditTask(task, userId);
                case 'delete':
                    return this.canDeleteTask(task, userId);
                case 'comment':
                    return this.canCommentOnTask(task, userId);
                case 'status-change':
                    return this.canChangeStatus(task, userId);
                case 'assign':
                    return this.canAssignTask(task, userId);
                case 'time-track':
                    return this.canTrackTime(task, userId);
                default:
                    return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking permissions:', error);
            throw error;
        }
    }
    /**
     * Status transition validation
     */
    static validateStatusTransition(currentStatus, newStatus, userId) {
        const allowedTransitions = {
            'draft': ['new'],
            'new': ['in-progress', 'cancelled'],
            'in-progress': ['pending-approval', 'cancelled'],
            'pending-approval': ['approved', 'rejected', 'in-progress'],
            'approved': ['completed', 'in-progress'],
            'rejected': ['in-progress', 'cancelled'],
            'completed': [],
            'cancelled': []
        };
        // Check if transition is allowed
        return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }
    /**
     * Permission check methods
     */
    static canViewTask(task, userId) {
        return (task.assigneeId === userId ||
            task.assignerId === userId ||
            task.workflow?.sequence?.some((step) => step.assigneeId === userId) ||
            false);
    }
    static canEditTask(task, userId) {
        // Can't edit completed or cancelled tasks
        if (['completed', 'cancelled'].includes(task.status)) {
            return false;
        }
        // Only assignee and assigner can edit
        return task.assigneeId === userId || task.assignerId === userId;
    }
    static canDeleteTask(task, userId) {
        // Only task creator can delete
        return task.assignerId === userId;
    }
    static canCommentOnTask(task, userId) {
        // Anyone involved can comment
        return (task.assigneeId === userId ||
            task.assignerId === userId ||
            task.workflow?.sequence?.some((step) => step.assigneeId === userId) ||
            false);
    }
    static canChangeStatus(task, userId) {
        switch (task.status) {
            case 'in-progress':
                // Only assignee can mark as pending-approval
                return task.assigneeId === userId;
            case 'pending-approval':
                // Only current step assignee can approve/reject
                const currentStep = task.workflow?.sequence?.[task.workflow.currentStep - 1];
                return currentStep?.assigneeId === userId;
            case 'approved':
                // Only assignee can mark as completed
                return task.assigneeId === userId;
            case 'rejected':
                // Only assignee can restart work
                return task.assigneeId === userId;
            default:
                // Other transitions by assignee or assigner
                return task.assigneeId === userId || task.assignerId === userId;
        }
    }
    static canAssignTask(task, userId) {
        // Only original assigner can reassign
        return task.assignerId === userId;
    }
    static canTrackTime(task, userId) {
        // Only assignee can track time
        return (task.assigneeId === userId &&
            !['completed', 'cancelled'].includes(task.status));
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=permission.service.js.map