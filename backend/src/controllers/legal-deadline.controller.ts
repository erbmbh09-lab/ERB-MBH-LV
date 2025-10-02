import { Request, Response } from 'express';
import { LegalDeadlineService } from '../services/legal-deadline.service';
import { logger } from '../utils/logger';

export const getLegalDeadlines = async (req: Request, res: Response) => {
  try {
    const { caseNumber } = req.query;
    
    let deadlines;
    if (caseNumber) {
      deadlines = await LegalDeadlineService.getDeadlinesForCase(caseNumber as string);
    } else {
      deadlines = await LegalDeadlineService.getAllActiveDeadlines();
    }

    res.json({
      status: 'success',
      data: { deadlines }
    });
  } catch (error) {
    logger.error('Error getting legal deadlines:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};