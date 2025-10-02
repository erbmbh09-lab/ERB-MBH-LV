import { Request, Response } from 'express';
import { TimeTrackingService } from '../services/time-tracking.service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const addTimeEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { date, hours, description, billable = true } = req.body;

    const task = await TimeTrackingService.addTimeEntry(taskId, {
      date,
      hours,
      description,
      billable,
      userId: req.user.employeeId
    });

    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    logger.error('Error adding time entry:', error);
    throw error;
  }
};

export const updateBillingInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { rateType, rate, currency } = req.body;

    const task = await TimeTrackingService.updateBillingInfo(
      taskId,
      req.user.employeeId,
      { rateType, rate, currency }
    );

    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    logger.error('Error updating billing info:', error);
    throw error;
  }
};

export const getTimeReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, userId, billableOnly, groupBy } = req.query;

    const report = await TimeTrackingService.generateTimeReport({
      startDate: startDate as string,
      endDate: endDate as string,
      userId: userId ? parseInt(userId as string) : undefined,
      billableOnly: billableOnly === 'true',
      groupBy: groupBy as 'user' | 'task' | 'category'
    });

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    logger.error('Error generating time report:', error);
    throw error;
  }
};

export const getBillingReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, currency } = req.query;

    const report = await TimeTrackingService.generateBillingReport({
      startDate: startDate as string,
      endDate: endDate as string,
      currency: currency as 'USD' | 'AED' | 'SAR'
    });

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    logger.error('Error generating billing report:', error);
    throw error;
  }
};