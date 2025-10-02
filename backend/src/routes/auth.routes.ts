import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

// Authentication routes
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);
router.post('/change-password', AuthController.changePassword);

export default router;