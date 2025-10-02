import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const initializeWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { steps } = req.body;

    const task = await WorkflowService.initializeWorkflow(taskId, steps);

    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    logger.error('Error initializing workflow:', error);
    throw error;
  }
};

export const processStepAction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { stepNumber, action, notes } = req.body;

    const task = await WorkflowService.processStepAction(
      taskId,
      stepNumber,
      req.user.employeeId,
      action,
      notes
    );

    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    logger.error('Error processing workflow step:', error);
    throw error;
  }
};

export const addStepDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { stepNumber, documents } = req.body;

    const task = await WorkflowService.addStepDocuments(
      taskId,
      stepNumber,
      req.user.employeeId,
      documents
    );

    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    logger.error('Error adding step documents:', error);
    throw error;
  }
};