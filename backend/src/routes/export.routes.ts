import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ExportController from '../controllers/export.controller';

const router = Router();

// Export task reports
router.get(
  '/reports/export',
  authenticate,
  ExportController.generateReport
);

export default router;