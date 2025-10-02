import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as TaskController from '../controllers/task.controller';

const router = Router();

// Get all tasks (with optional filters)
router.get('/',
  authenticate,
  authorize(['task.query']),
  TaskController.getTasks
);

// Get a specific task
router.get('/:id',
  authenticate,
  authorize(['task.query']),
  TaskController.getTaskById
);

// Create a new task
router.post('/',
  authenticate,
  authorize(['task.create']),
  TaskController.createTask
);

// Update a task
router.put('/:id',
  authenticate,
  authorize(['task.update']),
  TaskController.updateTask
);

// Add a comment to a task
router.post('/:id/comments',
  authenticate,
  authorize(['task.comment']),
  TaskController.addComment
);

// Delete a task
router.delete('/:id',
  authenticate,
  authorize(['task.delete']),
  TaskController.deleteTask
);

export default router;