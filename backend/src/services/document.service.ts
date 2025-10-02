import { Task } from '../models/task.model';
import { NotificationService } from './notification.service';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface DocumentMetadata {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  tags?: string[];
  category?: string;
  expiryDate?: string;
  requiredBy?: string;
}

export class DocumentService {
  /**
   * Add documents to task
   */
  static async addDocuments(
    taskId: string,
    userId: number,
    documents: DocumentMetadata[],
    workflowStepNumber?: number
  ) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
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
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
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
        },
        { new: true }
      );

      // Check if documents fulfill court requirements
      if (task.courtInfo?.requiredDocuments?.length) {
        await this.checkCourtDocuments(taskId, documents);
      }

      // Send notifications
      await this.notifyDocumentAddition(task, documents, userId);

      return updatedTask;
    } catch (error) {
      logger.error('Error adding documents:', error);
      throw error;
    }
  }

  /**
   * Check document expiry and send reminders
   */
  static async checkDocumentExpiry(taskId: string) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      const today = new Date();
      const expiringDocs = task.comments
        ?.flatMap(comment => comment.attachments || [])
        .filter(doc => {
          if (!doc.expiryDate) return false;
          const expiryDate = new Date(doc.expiryDate);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry <= 30;
        });

      if (expiringDocs?.length) {
        // Send expiry notifications
        await NotificationService.createTaskNotification(
          taskId,
          task.assigneeId,
          'تنبيه انتهاء صلاحية المستندات',
          `لديك ${expiringDocs.length} مستند(ات) على وشك انتهاء الصلاحية`
        );

        // Add reminders
        const reminderUpdates = expiringDocs.map(doc => ({
          type: 'notification' as const,
          beforeDue: 7 * 24 * 60, // 7 days before expiry
          message: `المستند ${doc.fileName} سينتهي في ${doc.expiryDate}`
        }));

        await Task.findByIdAndUpdate(taskId, {
          $push: { reminders: { $each: reminderUpdates } }
        });
      }

      return expiringDocs;
    } catch (error) {
      logger.error('Error checking document expiry:', error);
      throw error;
    }
  }

  /**
   * Validate required court documents
   */
  private static async checkCourtDocuments(taskId: string, documents: DocumentMetadata[]) {
    const task = await Task.findById(taskId);
    if (!task?.courtInfo?.requiredDocuments) return;

    const requiredDocs = new Set(task.courtInfo.requiredDocuments);
    const submittedDocs = new Set(documents.map(d => d.category));

    const missingDocs = [...requiredDocs].filter(doc => !submittedDocs.has(doc));

    if (missingDocs.length > 0) {
      await NotificationService.createTaskNotification(
        taskId,
        task.assigneeId,
        'مستندات مطلوبة ناقصة',
        `لا تزال المستندات التالية مطلوبة: ${missingDocs.join(', ')}`
      );
    }
  }

  /**
   * Send document notifications
   */
  private static async notifyDocumentAddition(
    task: any,
    documents: DocumentMetadata[],
    userId: number
  ) {
    // Notify task owner
    if (task.assigneeId !== userId) {
      await NotificationService.createTaskNotification(
        task._id,
        task.assigneeId,
        'مستندات جديدة',
        `تم إضافة ${documents.length} مستند(ات) جديدة للمهمة`
      );
    }

    // Notify workflow approvers if in review
    if (task.status === 'pending-approval' && task.workflow?.sequence) {
      const currentStep = task.workflow.sequence[task.workflow.currentStep - 1];
      if (currentStep && currentStep.assigneeId !== userId) {
        await NotificationService.createTaskNotification(
          task._id,
          currentStep.assigneeId,
          'مستندات جديدة للمراجعة',
          `تم إضافة ${documents.length} مستند(ات) جديدة تحتاج للمراجعة`
        );
      }
    }
  }
}