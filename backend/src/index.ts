import dotenv from 'dotenv';
import { app } from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});