import { Task } from '../models/task.model';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface RecurrencePattern {
  enabled: boolean;
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
}

export class RecurrenceService {
  /**
   * Create recurring instances of a task
   */
  static async createRecurringTasks(taskId: string, pattern: RecurrencePattern) {
    try {
      const sourceTask = await Task.findById(taskId);
      if (!sourceTask) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Calculate recurrence dates
      const dates = this.calculateRecurrenceDates(pattern);
      
      // Create recurring tasks
      const recurringTasks = await Promise.all(
        dates.map(date => this.createRecurringInstance(sourceTask, date))
      );

      // Update source task with recurrence info
      await Task.findByIdAndUpdate(taskId, {
        $set: {
          recurrence: {
            ...pattern,
            relatedTasks: recurringTasks.map(task => task._id)
          }
        }
      });

      return recurringTasks;
    } catch (error) {
      logger.error('Error creating recurring tasks:', error);
      throw error;
    }
  }

  /**
   * Update recurring task instances
   */
  static async updateRecurringInstances(taskId: string, updateData: any, updateFuture: boolean = false) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      if (!task.recurrence?.enabled) {
        throw new APIError('المهمة ليست متكررة', 400);
      }

      // Get all related tasks
      const relatedTasks = await Task.find({
        '_id': { $in: task.recurrence.relatedTasks || [] }
      });

      // Update future instances if requested
      if (updateFuture) {
        const currentDate = new Date();
        const futureTasks = relatedTasks.filter(t => 
          new Date(t.dueDate) > currentDate
        );

        await Promise.all(
          futureTasks.map(t =>
            Task.findByIdAndUpdate(t._id, { $set: updateData })
          )
        );
      }

      return await Task.findById(taskId);
    } catch (error) {
      logger.error('Error updating recurring instances:', error);
      throw error;
    }
  }

  /**
   * Calculate recurrence dates based on pattern
   */
  private static calculateRecurrenceDates(pattern: RecurrencePattern): Date[] {
    const dates: Date[] = [];
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
  private static isValidOccurrence(date: Date, pattern: RecurrencePattern): boolean {
    if (pattern.pattern === 'custom' && pattern.daysOfWeek?.length) {
      return pattern.daysOfWeek.includes(date.getDay());
    }
    return true;
  }

  /**
   * Create a single recurring instance of a task
   */
  private static async createRecurringInstance(sourceTask: any, dueDate: Date) {
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

    return await Task.create(taskData);
  }
}