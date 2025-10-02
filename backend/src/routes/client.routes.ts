import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as ClientController from '../controllers/client.controller';

const router = Router();

// Get all clients (with optional filters)
router.get('/', 
  authenticate,
  authorize(['client.query']),
  ClientController.getClients
);

// Get a specific client
router.get('/:id',
  authenticate,
  authorize(['client.query']),
  ClientController.getClientById
);

// Create a new client
router.post('/',
  authenticate,
  authorize(['client.create']),
  ClientController.createClient
);

// Update a client
router.put('/:id',
  authenticate,
  authorize(['client.update']),
  ClientController.updateClient
);

// Delete a client
router.delete('/:id',
  authenticate,
  authorize(['client.delete']),
  ClientController.deleteClient
);

export default router;