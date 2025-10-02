import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await NotificationService.getUnreadNotifications(req.user._id);
    
    res.json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await NotificationService.markAsRead(notificationId, req.user._id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    
    res.json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const archiveNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await NotificationService.archiveNotification(notificationId, req.user._id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    logger.error('Error archiving notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};