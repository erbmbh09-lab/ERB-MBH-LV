import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as TimeTrackingController from '../controllers/time-tracking.controller';

const router = Router();

// Add time entry to task
router.post(
  '/tasks/:taskId/time',
  authenticate,
  TimeTrackingController.addTimeEntry
);

// Update task billing information
router.put(
  '/tasks/:taskId/billing',
  authenticate,
  TimeTrackingController.updateBillingInfo
);

// Get time tracking report
router.get(
  '/reports/time',
  authenticate,
  TimeTrackingController.getTimeReport
);

// Get billing report
router.get(
  '/reports/billing',
  authenticate,
  TimeTrackingController.getBillingReport
);

export default router;