import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as HRController from '../controllers/hr.controller';

const router = Router();

// Get all employees (with optional filters)
router.get('/',
  authenticate,
  authorize(['hr.query']),
  HRController.getEmployees
);

// Get a specific employee
router.get('/:id',
  authenticate,
  authorize(['hr.query']),
  HRController.getEmployeeById
);

// Create a new employee
router.post('/',
  authenticate,
  authorize(['hr.create']),
  HRController.createEmployee
);

// Update an employee
router.put('/:id',
  authenticate,
  authorize(['hr.update']),
  HRController.updateEmployee
);

// Delete an employee
router.delete('/:id',
  authenticate,
  authorize(['hr.delete']),
  HRController.deleteEmployee
);

export default router;