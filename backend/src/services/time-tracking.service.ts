import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface TimeEntry {
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  userId: number;
}

interface BillingInfo {
  rateType: 'hourly' | 'fixed' | 'non-billable';
  rate?: number;
  currency?: 'USD' | 'AED' | 'SAR';
}

export class TimeTrackingService {
  /**
   * Add a time entry to a task
   */
  static async addTimeEntry(taskId: string, entry: TimeEntry) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Validate user has permission to add time
      if (task.assigneeId !== entry.userId && task.assignerId !== entry.userId) {
        throw new APIError('غير مصرح لك بإضافة وقت لهذه المهمة', 403);
      }

      // Add time entry
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $push: { timeEntries: entry },
          $inc: { actualHours: entry.hours }
        },
        { new: true }
      );

      // Add to audit trail
      await Task.findByIdAndUpdate(taskId, {
        $push: {
          auditTrail: {
            action: 'time-tracked',
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            details: {
              hours: entry.hours,
              date: entry.date,
              billable: entry.billable
            }
          }
        }
      });

      return updatedTask;
    } catch (error) {
      logger.error('Error adding time entry:', error);
      throw error;
    }
  }

  /**
   * Update billing information for a task
   */
  static async updateBillingInfo(taskId: string, userId: number, billingInfo: BillingInfo) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Validate user has permission to update billing
      if (task.assignerId !== userId) {
        throw new APIError('غير مصرح لك بتحديث معلومات الفوترة', 403);
      }

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: { billing: billingInfo } },
        { new: true }
      );

      // Add to audit trail
      await Task.findByIdAndUpdate(taskId, {
        $push: {
          auditTrail: {
            action: 'billing-updated',
            timestamp: new Date().toISOString(),
            userId,
            details: billingInfo
          }
        }
      });

      return updatedTask;
    } catch (error) {
      logger.error('Error updating billing info:', error);
      throw error;
    }
  }

  /**
   * Generate time tracking report
   */
  static async generateTimeReport(params: {
    startDate: string;
    endDate: string;
    userId?: number;
    billableOnly?: boolean;
    groupBy?: 'user' | 'task' | 'category';
  }) {
    try {
      const matchStage: any = {
        'timeEntries.date': {
          $gte: params.startDate,
          $lte: params.endDate
        }
      };

      if (params.userId) {
        matchStage['timeEntries.userId'] = params.userId;
      }

      if (params.billableOnly) {
        matchStage['timeEntries.billable'] = true;
      }

      const pipeline = [
        { $match: matchStage },
        { $unwind: '$timeEntries' },
        {
          $group: {
            _id: params.groupBy === 'user' ? '$timeEntries.userId' :
                params.groupBy === 'category' ? '$category' : '$_id',
            totalHours: { $sum: '$timeEntries.hours' },
            billableHours: {
              $sum: {
                $cond: [
                  { $eq: ['$timeEntries.billable', true] },
                  '$timeEntries.hours',
                  0
                ]
              }
            },
            entries: { $push: '$timeEntries' },
            tasks: {
              $addToSet: {
                taskId: '$_id',
                title: '$title',
                category: '$category'
              }
            }
          }
        }
      ];

      const results = await Task.aggregate(pipeline);

      // Enrich with user names if grouped by user
      if (params.groupBy === 'user' && results.length > 0) {
        const userIds = results.map(r => r._id);
        const employees = await Employee.find({ id: { $in: userIds } });
        const employeeMap = new Map(employees.map(e => [e.id, e.name]));

        results.forEach(result => {
          result.userName = employeeMap.get(result._id);
        });
      }

      // Calculate summary
      const summary = {
        totalHours: results.reduce((sum, r) => sum + r.totalHours, 0),
        billableHours: results.reduce((sum, r) => sum + r.billableHours, 0),
        totalTasks: new Set(results.flatMap(r => r.tasks.map(t => t.taskId))).size,
        dateRange: {
          from: params.startDate,
          to: params.endDate
        }
      };

      return {
        details: results,
        summary
      };
    } catch (error) {
      logger.error('Error generating time report:', error);
      throw error;
    }
  }

  /**
   * Generate billing report
   */
  static async generateBillingReport(params: {
    startDate: string;
    endDate: string;
    currency?: 'USD' | 'AED' | 'SAR';
  }) {
    try {
      const pipeline = [
        {
          $match: {
            'timeEntries.date': {
              $gte: params.startDate,
              $lte: params.endDate
            },
            'billing.billable': true
          }
        },
        { $unwind: '$timeEntries' },
        {
          $group: {
            _id: {
              taskId: '$_id',
              rateType: '$billing.rateType',
              rate: '$billing.rate',
              currency: '$billing.currency'
            },
            totalHours: { $sum: '$timeEntries.hours' },
            details: {
              $first: {
                title: '$title',
                category: '$category',
                assigneeId: '$assigneeId'
              }
            }
          }
        },
        {
          $project: {
            amount: {
              $cond: [
                { $eq: ['$_id.rateType', 'hourly'] },
                { $multiply: ['$totalHours', { $ifNull: ['$_id.rate', 0] }] },
                { $ifNull: ['$_id.rate', 0] }
              ]
            },
            currency: '$_id.currency',
            hours: '$totalHours',
            rateType: '$_id.rateType',
            rate: '$_id.rate',
            details: 1
          }
        }
      ];

      if (params.currency) {
        pipeline.unshift({
          $match: {
            'billing.currency': params.currency
          }
        });
      }

      const results = await Task.aggregate(pipeline);

      // Enrich with employee names
      const employeeIds = [...new Set(results.map(r => r.details.assigneeId))];
      const employees = await Employee.find({ id: { $in: employeeIds } });
      const employeeMap = new Map(employees.map(e => [e.id, e.name]));

      results.forEach(result => {
        result.details.assigneeName = employeeMap.get(result.details.assigneeId);
      });

      // Calculate summary
      const summary = {
        totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
        totalHours: results.reduce((sum, r) => sum + r.hours, 0),
        currency: params.currency || 'Multiple',
        dateRange: {
          from: params.startDate,
          to: params.endDate
        }
      };

      return {
        entries: results,
        summary
      };
    } catch (error) {
      logger.error('Error generating billing report:', error);
      throw error;
    }
  }
}