import { Task } from '../models/task.model';
import { NotificationService } from './notification.service';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CourtInfo {
  caseNumber: string;
  courtName: string;
  hearingDate?: string;
  deadline?: string;
  requiredDocuments?: string[];
}

export class CourtService {
  /**
   * Link task to court case
   */
  static async linkToCourtCase(taskId: string, courtInfo: CourtInfo, userId: number) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Update task with court info
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: { courtInfo },
          $push: {
            auditTrail: {
              action: 'court-info-added',
              timestamp: new Date().toISOString(),
              userId,
              details: courtInfo
            }
          }
        },
        { new: true }
      );

      // Set up reminders for court dates
      if (courtInfo.hearingDate) {
        await this.setupCourtDateReminders(taskId, courtInfo);
      }

      return updatedTask;
    } catch (error) {
      logger.error('Error linking to court case:', error);
      throw error;
    }
  }

  /**
   * Update court hearing date
   */
  static async updateHearingDate(taskId: string, hearingDate: string, userId: number) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      if (!task.courtInfo) {
        throw new APIError('لا توجد معلومات محكمة مرتبطة', 400);
      }

      // Update hearing date
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: { 'courtInfo.hearingDate': hearingDate },
          $push: {
            auditTrail: {
              action: 'hearing-date-updated',
              timestamp: new Date().toISOString(),
              userId,
              details: { oldDate: task.courtInfo.hearingDate, newDate: hearingDate }
            }
          }
        },
        { new: true }
      );

      // Update reminders
      await this.setupCourtDateReminders(taskId, {
        ...task.courtInfo,
        hearingDate
      });

      return updatedTask;
    } catch (error) {
      logger.error('Error updating hearing date:', error);
      throw error;
    }
  }

  /**
   * Update required documents
   */
  static async updateRequiredDocuments(
    taskId: string,
    documents: string[],
    userId: number
  ) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: { 'courtInfo.requiredDocuments': documents },
          $push: {
            auditTrail: {
              action: 'documents-updated',
              timestamp: new Date().toISOString(),
              userId,
              details: { documents }
            }
          }
        },
        { new: true }
      );

      // Notify assignee about document requirements
      if (documents.length > 0) {
        await NotificationService.createTaskNotification(
          taskId,
          task.assigneeId,
          'تحديث المستندات المطلوبة',
          `تم تحديث قائمة المستندات المطلوبة للقضية ${task.courtInfo?.caseNumber}`
        );
      }

      return updatedTask;
    } catch (error) {
      logger.error('Error updating required documents:', error);
      throw error;
    }
  }

  /**
   * Setup reminders for court dates
   */
  private static async setupCourtDateReminders(taskId: string, courtInfo: CourtInfo) {
    const hearingDate = new Date(courtInfo.hearingDate!);
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
      beforeDue: reminder.days ? reminder.days * 24 * 60 : reminder.hours! * 60,
      message: `تذكير: جلسة محكمة للقضية ${courtInfo.caseNumber} في ${courtInfo.courtName}`
    }));

    await Task.findByIdAndUpdate(taskId, {
      $push: { reminders: { $each: reminderUpdates } }
    });
  }
}