import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface PermissionCheck {
  taskId: string;
  userId: number;
  action: 'view' | 'edit' | 'delete' | 'comment' | 'status-change' | 'assign' | 'time-track';
}

export class PermissionService {
  /**
   * Check if user has permission for specific action
   */
  static async checkPermission({ taskId, userId, action }: PermissionCheck): Promise<boolean> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new APIError('المهمة غير موجودة', 404);
      }

      const employee = await Employee.findOne({ id: userId });
      if (!employee) {
        throw new APIError('المستخدم غير موجود', 404);
      }

      // Check role-based permissions
      if (employee.role === 'admin') return true;

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
    } catch (error) {
      logger.error('Error checking permissions:', error);
      throw error;
    }
  }

  /**
   * Status transition validation
   */
  static validateStatusTransition(currentStatus: string, newStatus: string, userId: number): boolean {
    const allowedTransitions: { [key: string]: string[] } = {
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
  private static canViewTask(task: any, userId: number): boolean {
    return (
      task.assigneeId === userId ||
      task.assignerId === userId ||
      task.workflow?.sequence?.some((step: any) => step.assigneeId === userId) ||
      false
    );
  }

  private static canEditTask(task: any, userId: number): boolean {
    // Can't edit completed or cancelled tasks
    if (['completed', 'cancelled'].includes(task.status)) {
      return false;
    }

    // Only assignee and assigner can edit
    return task.assigneeId === userId || task.assignerId === userId;
  }

  private static canDeleteTask(task: any, userId: number): boolean {
    // Only task creator can delete
    return task.assignerId === userId;
  }

  private static canCommentOnTask(task: any, userId: number): boolean {
    // Anyone involved can comment
    return (
      task.assigneeId === userId ||
      task.assignerId === userId ||
      task.workflow?.sequence?.some((step: any) => step.assigneeId === userId) ||
      false
    );
  }

  private static canChangeStatus(task: any, userId: number): boolean {
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

  private static canAssignTask(task: any, userId: number): boolean {
    // Only original assigner can reassign
    return task.assignerId === userId;
  }

  private static canTrackTime(task: any, userId: number): boolean {
    // Only assignee can track time
    return (
      task.assigneeId === userId &&
      !['completed', 'cancelled'].includes(task.status)
    );
  }
}