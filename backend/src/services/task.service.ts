import { Task } from '../models/task.model';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class TaskService {
  static async assignTask(
    assignerId: number,
    assigneeId: number,
    taskData: {
      title: string;
      description: string;
      type: 'personal' | 'assigned';
      priority: 'low' | 'medium' | 'high';
      dueDate: string;
      relatedCaseId?: string;
    }
  ) {
    try {
      // Create task
      const task = await Task.create({
        ...taskData,
        assignerId,
        assigneeId,
        status: 'new',
        createdAt: new Date().toISOString()
      });

      // Create notification for assignee
      await NotificationService.createTaskNotification(
        task._id.toString(),
        assigneeId,
        'مهمة جديدة',
        `تم تكليفك بمهمة جديدة: ${taskData.title}`
      );

      return task;
    } catch (error) {
      logger.error('Error assigning task:', error);
      throw error;
    }
  }

  static async updateTaskStatus(
    taskId: string,
    status: string,
    userId: number,
    notes?: string
  ) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(task.status, status, userId, task)) {
        throw new Error('Invalid status transition');
      }

      const update: any = { status };
      
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

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: update },
        { new: true }
      );

      // Create notifications based on status change
      await this.createStatusChangeNotifications(task, status, userId);

      return updatedTask;
    } catch (error) {
      logger.error('Error updating task status:', error);
      throw error;
    }
  }

  private static isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
    userId: number,
    task: any
  ): boolean {
    // Only assignee can mark as in-progress or completed
    if (['in-progress', 'completed'].includes(newStatus) && task.assigneeId !== userId) {
      return false;
    }

    // Only assigner can approve or reject
    if (['approved', 'rejected'].includes(newStatus) && task.assignerId !== userId) {
      return false;
    }

    // Status transition rules
    const allowedTransitions: { [key: string]: string[] } = {
      'new': ['in-progress', 'rejected'],
      'in-progress': ['completed', 'rejected'],
      'completed': ['pending-approval'],
      'pending-approval': ['approved', 'rejected'],
      'rejected': ['in-progress']
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private static async createStatusChangeNotifications(
    task: any,
    newStatus: string,
    userId: number
  ) {
    const notificationData = {
      taskId: task._id.toString(),
      title: ''
    };

    switch (newStatus) {
      case 'in-progress':
        notificationData.title = `المهمة "${task.title}" قيد التنفيذ`;
        await NotificationService.createTaskNotification(
          task._id.toString(),
          task.assignerId,
          notificationData.title,
          `بدأ ${userId} العمل على المهمة`
        );
        break;

      case 'completed':
        notificationData.title = `المهمة "${task.title}" مكتملة`;
        await NotificationService.createTaskNotification(
          task._id.toString(),
          task.assignerId,
          notificationData.title,
          `أكمل ${userId} المهمة وهي تنتظر المراجعة`
        );
        break;

      case 'pending-approval':
        notificationData.title = `المهمة "${task.title}" تنتظر الموافقة`;
        await NotificationService.createTaskNotification(
          task._id.toString(),
          task.assignerId,
          notificationData.title,
          `المهمة جاهزة للمراجعة والموافقة`
        );
        break;

      case 'approved':
        notificationData.title = `المهمة "${task.title}" معتمدة`;
        await NotificationService.createTaskNotification(
          task._id.toString(),
          task.assigneeId,
          notificationData.title,
          `تمت الموافقة على المهمة`
        );
        break;

      case 'rejected':
        notificationData.title = `المهمة "${task.title}" مرفوضة`;
        await NotificationService.createTaskNotification(
          task._id.toString(),
          task.assigneeId,
          notificationData.title,
          `تم رفض المهمة. يرجى مراجعة التعليقات`
        );
        break;
    }
  }

  static async addComment(taskId: string, authorId: number, content: string) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const comment = {
        authorId,
        content,
        timestamp: new Date().toISOString()
      };

      // Add comment
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $push: { comments: comment } },
        { new: true }
      );

      // Notify relevant users
      const notifyUserId = authorId === task.assigneeId ? task.assignerId : task.assigneeId;
      await NotificationService.createTaskNotification(
        taskId,
        notifyUserId,
        `تعليق جديد على المهمة "${task.title}"`,
        content
      );

      return updatedTask;
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw error;
    }
  }

  static async getTasksByUser(userId: number, filters: any = {}) {
    try {
      const query: any = {
        $or: [
          { assigneeId: userId },
          { assignerId: userId }
        ]
      };

      // Apply additional filters
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.type) query.type = filters.type;
      if (filters.relatedCaseId) query.relatedCaseId = filters.relatedCaseId;

      const tasks = await Task.find(query).sort({ createdAt: -1 });
      return tasks;
    } catch (error) {
      logger.error('Error getting tasks by user:', error);
      throw error;
    }
  }
}