import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as CaseController from '../controllers/case.controller';
import * as LegalDeadlineController from '../controllers/legal-deadline.controller';

const router = Router();

// Get all cases (with optional filters)
router.get('/', 
  authenticate,
  authorize(['case.query']),
  CaseController.getCases
);

// Get a specific case
router.get('/:id',
  authenticate,
  authorize(['case.query']),
  CaseController.getCaseById
);

// Create a new case
router.post('/',
  authenticate,
  authorize(['case.create']),
  CaseController.createCase
);

// Update a case
router.put('/:id',
  authenticate,
  authorize(['case.update']),
  CaseController.updateCase
);

// Link multiple cases
router.post('/link',
  authenticate,
  authorize(['case.update']),
  CaseController.linkCases
);

// Delete a case
router.delete('/:id',
  authenticate,
  authorize(['case.delete']),
  CaseController.deleteCase
);

// Get legal deadlines
router.get('/legal-deadlines',
  authenticate,
  authorize(['case.query']),
  LegalDeadlineController.getLegalDeadlines
);

export default router;