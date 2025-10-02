import { Express } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import caseRoutes from './case.routes';
import taskRoutes from './task.routes';
import hrRoutes from './hr.routes';
import notificationRoutes from './notification.routes';

export const setupRoutes = (app: Express) => {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/clients`, clientRoutes);
  app.use(`${apiPrefix}/cases`, caseRoutes);
  app.use(`${apiPrefix}/tasks`, taskRoutes);
  app.use(`${apiPrefix}/employees`, hrRoutes);
  app.use(`${apiPrefix}/notifications`, notificationRoutes);
  // Additional routes will be mounted here as they are created
};