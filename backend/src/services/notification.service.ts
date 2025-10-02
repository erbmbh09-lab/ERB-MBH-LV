import { Notification, INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { Employee } from '../models/employee.model';
import { Client } from '../models/client.model';
import { logger } from '../utils/logger';

export class NotificationService {
  static async createNotification(data: {
    userId: string;
    employeeId?: number;
    clientId?: number;
    title: string;
    content: string;
    type: INotification['type'];
    priority?: INotification['priority'];
    relatedTo?: {
      type: 'case' | 'task' | 'document' | 'employee' | 'client';
      id: string;
    };
    actionRequired?: string;
    expiresAt?: Date;
  }) {
    try {
      const notification = await Notification.create(data);
      logger.info(`Created notification: ${notification.id}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createTaskNotification(taskId: string, assigneeId: number, title: string, content: string) {
    try {
      const user = await User.findOne({ employeeId: assigneeId });
      if (!user) {
        logger.error(`No user found for employee ID: ${assigneeId}`);
        return null;
      }

      return await this.createNotification({
        userId: user._id.toString(),
        employeeId: assigneeId,
        title,
        content,
        type: 'TASK',
        priority: 'high',
        relatedTo: {
          type: 'task',
          id: taskId
        }
      });
    } catch (error) {
      logger.error('Error creating task notification:', error);
      throw error;
    }
  }

  static async createDeadlineNotification(
    caseId: string,
    employeeId: number,
    title: string,
    content: string,
    expiresAt: Date
  ) {
    try {
      const user = await User.findOne({ employeeId });
      if (!user) {
        logger.error(`No user found for employee ID: ${employeeId}`);
        return null;
      }

      return await this.createNotification({
        userId: user._id.toString(),
        employeeId,
        title,
        content,
        type: 'DEADLINE',
        priority: 'urgent',
        relatedTo: {
          type: 'case',
          id: caseId
        },
        expiresAt
      });
    } catch (error) {
      logger.error('Error creating deadline notification:', error);
      throw error;
    }
  }

  static async createDocumentExpiryNotification(
    documentType: string,
    employeeId: number,
    expiryDate: Date
  ) {
    try {
      const user = await User.findOne({ employeeId });
      if (!user) {
        logger.error(`No user found for employee ID: ${employeeId}`);
        return null;
      }

      const employee = await Employee.findOne({ id: employeeId });
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

      return await this.createNotification({
        userId: user._id.toString(),
        employeeId,
        title: `${documentType} Expiry Warning`,
        content: `Your ${documentType} will expire in ${daysUntilExpiry} days. Please renew it before ${expiryDate.toLocaleDateString()}.`,
        type: 'DOCUMENT',
        priority: daysUntilExpiry <= 7 ? 'urgent' : 'high',
        relatedTo: {
          type: 'employee',
          id: employee!._id.toString()
        },
        expiresAt: expiryDate
      });
    } catch (error) {
      logger.error('Error creating document expiry notification:', error);
      throw error;
    }
  }

  static async createCaseUpdateNotification(
    caseId: string,
    employeeIds: number[],
    title: string,
    content: string
  ) {
    try {
      const users = await User.find({ employeeId: { $in: employeeIds } });
      
      const notifications = await Promise.all(
        users.map(user => 
          this.createNotification({
            userId: user._id.toString(),
            employeeId: user.employeeId,
            title,
            content,
            type: 'CASE',
            priority: 'medium',
            relatedTo: {
              type: 'case',
              id: caseId
            }
          })
        )
      );

      return notifications;
    } catch (error) {
      logger.error('Error creating case update notifications:', error);
      throw error;
    }
  }

  static async getUnreadNotifications(userId: string) {
    try {
      return await Notification.find({
        userId,
        status: 'unread'
      }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            status: 'read',
            readAt: new Date()
          }
        },
        { new: true }
      );

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const result = await Notification.updateMany(
        { userId, status: 'unread' },
        {
          $set: {
            status: 'read',
            readAt: new Date()
          }
        }
      );

      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async archiveNotification(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { status: 'archived' } },
        { new: true }
      );

      return notification;
    } catch (error) {
      logger.error('Error archiving notification:', error);
      throw error;
    }
  }

  static async deleteExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      logger.info(`Deleted ${result.deletedCount} expired notifications`);
      return result;
    } catch (error) {
      logger.error('Error deleting expired notifications:', error);
      throw error;
    }
  }
}