"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceService = void 0;
const task_model_1 = require("../models/task.model");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class RecurrenceService {
    /**
     * Create recurring instances of a task
     */
    static async createRecurringTasks(taskId, pattern) {
        try {
            const sourceTask = await task_model_1.Task.findById(taskId);
            if (!sourceTask) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            // Calculate recurrence dates
            const dates = this.calculateRecurrenceDates(pattern);
            // Create recurring tasks
            const recurringTasks = await Promise.all(dates.map(date => this.createRecurringInstance(sourceTask, date)));
            // Update source task with recurrence info
            await task_model_1.Task.findByIdAndUpdate(taskId, {
                $set: {
                    recurrence: {
                        ...pattern,
                        relatedTasks: recurringTasks.map(task => task._id)
                    }
                }
            });
            return recurringTasks;
        }
        catch (error) {
            logger_1.logger.error('Error creating recurring tasks:', error);
            throw error;
        }
    }
    /**
     * Update recurring task instances
     */
    static async updateRecurringInstances(taskId, updateData, updateFuture = false) {
        try {
            const task = await task_model_1.Task.findById(taskId);
            if (!task) {
                throw new errorHandler_1.APIError('المهمة غير موجودة', 404);
            }
            if (!task.recurrence?.enabled) {
                throw new errorHandler_1.APIError('المهمة ليست متكررة', 400);
            }
            // Get all related tasks
            const relatedTasks = await task_model_1.Task.find({
                '_id': { $in: task.recurrence.relatedTasks || [] }
            });
            // Update future instances if requested
            if (updateFuture) {
                const currentDate = new Date();
                const futureTasks = relatedTasks.filter(t => new Date(t.dueDate) > currentDate);
                await Promise.all(futureTasks.map(t => task_model_1.Task.findByIdAndUpdate(t._id, { $set: updateData })));
            }
            return await task_model_1.Task.findById(taskId);
        }
        catch (error) {
            logger_1.logger.error('Error updating recurring instances:', error);
            throw error;
        }
    }
    /**
     * Calculate recurrence dates based on pattern
     */
    static calculateRecurrenceDates(pattern) {
        const dates = [];
        const startDate = new Date();
        const endDate = pattern.endDate ? new Date(pattern.endDate) : undefined;
        const maxOccurrences = pattern.occurrences || 52; // Default max 1 year for weekly
        let currentDate = new Date(startDate);
        let occurrences = 0;
        while (occurrences < maxOccurrences &&
            (!endDate || currentDate <= endDate)) {
            if (this.isValidOccurrence(currentDate, pattern)) {
                dates.push(new Date(currentDate));
                occurrences++;
            }
            // Advance to next potential date
            switch (pattern.pattern) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + pattern.interval);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + (pattern.interval * 7));
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + pattern.interval);
                    break;
                case 'custom':
                    if (pattern.daysOfWeek?.length) {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    break;
            }
        }
        return dates;
    }
    /**
     * Check if date matches recurrence pattern
     */
    static isValidOccurrence(date, pattern) {
        if (pattern.pattern === 'custom' && pattern.daysOfWeek?.length) {
            return pattern.daysOfWeek.includes(date.getDay());
        }
        return true;
    }
    /**
     * Create a single recurring instance of a task
     */
    static async createRecurringInstance(sourceTask, dueDate) {
        const taskData = {
            ...sourceTask.toObject(),
            _id: undefined,
            dueDate: dueDate.toISOString(),
            status: 'new',
            progress: 0,
            completedAt: undefined,
            comments: [],
            timeEntries: [],
            auditTrail: [{
                    action: 'created',
                    timestamp: new Date().toISOString(),
                    userId: sourceTask.assignerId,
                    details: { recurringFrom: sourceTask._id }
                }],
            parentTaskId: sourceTask._id
        };
        return await task_model_1.Task.create(taskData);
    }
}
exports.RecurrenceService = RecurrenceService;
//# sourceMappingURL=recurrence.service.js.map