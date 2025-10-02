import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { NotificationService } from './notification.service';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface WorkflowStep {
  step: number;
  name: string;
  type: 'review' | 'approval' | 'notification';
  assigneeId: number;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
}

export class WorkflowService {
  /**
   * Initialize a new workflow for a task
   */
  static async initializeWorkflow(taskId: string, steps: Omit<WorkflowStep, 'status' | 'completedAt'>[]) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Initialize workflow
      const workflow = {
        currentStep: 1,
        totalSteps: steps.length,
        sequence: steps.map(step => ({
          ...step,
          status: 'pending' as const
        })),
        autoAdvance: true,
        requireAllApprovals: true
      };

      // Update task with workflow
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: {
            workflow,
            status: 'pending-approval'
          }
        },
        { new: true }
      );

      // Notify first step assignee
      if (steps.length > 0) {
        await this.notifyStepAssignee(taskId, steps[0], task.title);
      }

      return updatedTask;
    } catch (error) {
      logger.error('Error initializing workflow:', error);
      throw error;
    }
  }

  /**
   * Process a workflow step action (approve/reject/request changes)
   */
  static async processStepAction(
    taskId: string,
    stepNumber: number,
    userId: number,
    action: 'approve' | 'reject' | 'request-changes',
    notes?: string
  ) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      if (!task.workflow) {
        throw new APIError('لا يوجد مسار عمل لهذه المهمة', 400);
      }

      // Validate step
      const step = task.workflow.sequence[stepNumber - 1];
      if (!step) {
        throw new APIError('خطوة مسار العمل غير موجودة', 400);
      }

      if (step.assigneeId !== userId) {
        throw new APIError('غير مصرح لك بتنفيذ هذا الإجراء', 403);
      }

      if (step.status !== 'pending') {
        throw new APIError('تم إكمال هذه الخطوة مسبقاً', 400);
      }

      // Process action
      const updateData: any = {
        [`workflow.sequence.${stepNumber - 1}.status`]: action === 'approve' ? 'completed' : 'pending',
        [`workflow.sequence.${stepNumber - 1}.completedAt`]: new Date().toISOString(),
        [`workflow.sequence.${stepNumber - 1}.notes`]: notes
      };

      if (action === 'approve') {
        // Move to next step if auto-advance is enabled
        if (task.workflow.autoAdvance && stepNumber < task.workflow.totalSteps) {
          updateData['workflow.currentStep'] = stepNumber + 1;
        }
        // If this is the last step and all previous steps are approved
        else if (stepNumber === task.workflow.totalSteps) {
          const allApproved = task.workflow.sequence.every(s => s.status === 'completed');
          if (allApproved) {
            updateData.status = 'approved';
          }
        }
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      }

      // Update task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true }
      );

      // Add to audit trail
      await Task.findByIdAndUpdate(taskId, {
        $push: {
          auditTrail: {
            action: 'workflow-advanced',
            timestamp: new Date().toISOString(),
            userId,
            details: {
              step: stepNumber,
              action,
              notes
            }
          }
        }
      });

      // Send notifications
      await this.sendWorkflowNotifications(task, stepNumber, action, userId, notes);

      return updatedTask;
    } catch (error) {
      logger.error('Error processing workflow step:', error);
      throw error;
    }
  }

  /**
   * Add documents to a workflow step
   */
  static async addStepDocuments(
    taskId: string,
    stepNumber: number,
    userId: number,
    documents: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>
  ) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      // Validate step
      const step = task.workflow?.sequence[stepNumber - 1];
      if (!step) {
        throw new APIError('خطوة مسار العمل غير موجودة', 400);
      }

      // Add documents as comments
      const comment = {
        authorId: userId,
        content: 'تم إضافة مستندات لخطوة المراجعة',
        timestamp: new Date().toISOString(),
        attachments: documents,
        workflowStep: stepNumber
      };

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $push: { comments: comment },
          $push: {
            auditTrail: {
              action: 'file-attached',
              timestamp: new Date().toISOString(),
              userId,
              details: {
                stepNumber,
                documentCount: documents.length
              }
            }
          }
        },
        { new: true }
      );

      // Notify relevant users
      await NotificationService.createTaskNotification(
        taskId,
        step.assigneeId,
        `مستندات جديدة للمراجعة - المهمة "${task.title}"`,
        `تم إضافة ${documents.length} مستند(ات) للمراجعة في الخطوة ${stepNumber}`
      );

      return updatedTask;
    } catch (error) {
      logger.error('Error adding step documents:', error);
      throw error;
    }
  }

  private static async notifyStepAssignee(taskId: string, step: WorkflowStep, taskTitle: string) {
    await NotificationService.createTaskNotification(
      taskId,
      step.assigneeId,
      `مطلوب إجراء - المهمة "${taskTitle}"`,
      `مطلوب ${step.type === 'approval' ? 'موافقتك' : 'مراجعتك'} في الخطوة "${step.name}"`
    );
  }

  private static async sendWorkflowNotifications(
    task: any,
    stepNumber: number,
    action: string,
    userId: number,
    notes?: string
  ) {
    const actionMessages = {
      'approve': 'تمت الموافقة على',
      'reject': 'تم رفض',
      'request-changes': 'تم طلب تعديلات على'
    };

    const message = `${actionMessages[action]} الخطوة ${stepNumber} (${task.workflow.sequence[stepNumber - 1].name})`;
    
    // Notify task owner
    await NotificationService.createTaskNotification(
      task._id,
      task.assigneeId,
      `تحديث مسار العمل - المهمة "${task.title}"`,
      `${message}${notes ? `\nملاحظات: ${notes}` : ''}`
    );

    // If there's a next step, notify the next assignee
    if (action === 'approve' && stepNumber < task.workflow.totalSteps) {
      const nextStep = task.workflow.sequence[stepNumber];
      await this.notifyStepAssignee(task._id, nextStep, task.title);
    }
  }
}