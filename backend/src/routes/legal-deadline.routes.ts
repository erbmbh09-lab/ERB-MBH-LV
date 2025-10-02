import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/requestValidator';
import { legalDeadlineSchema, deadlineStatusSchema, upcomingDeadlinesSchema } from '../schemas/legal-deadline.schema';
import * as LegalDeadlineController from '../controllers/legal-deadline.controller';

const router = Router();

// Create new legal deadline
router.post(
  '/deadlines',
  authenticate,
  validateRequest({ body: legalDeadlineSchema }),
  LegalDeadlineController.createDeadline
);

// Update deadline status
router.put(
  '/deadlines/:taskId/status',
  authenticate,
  validateRequest({ body: deadlineStatusSchema }),
  LegalDeadlineController.updateDeadlineStatus
);

// Get upcoming deadlines
router.get(
  '/deadlines/upcoming',
  authenticate,
  validateRequest({ query: upcomingDeadlinesSchema }),
  LegalDeadlineController.getUpcomingDeadlines
);

export default router;