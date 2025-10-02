import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as WorkflowController from '../controllers/workflow.controller';
import { validateRequest } from '../middleware/requestValidator';

const router = Router();

// Initialize workflow for a task
router.post(
  '/tasks/:taskId/workflow',
  authenticate,
  WorkflowController.initializeWorkflow
);

// Process workflow step action
router.post(
  '/tasks/:taskId/workflow/steps/:stepNumber/action',
  authenticate,
  WorkflowController.processStepAction
);

// Add documents to workflow step
router.post(
  '/tasks/:taskId/workflow/steps/:stepNumber/documents',
  authenticate,
  WorkflowController.addStepDocuments
);

export default router;