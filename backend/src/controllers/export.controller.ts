import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';
import { validateRequest } from '../middleware/requestValidator';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      format, 
      type, 
      dateRange, 
      filters,
      groupBy 
    } = validateExportParams(req.query);

    const buffer = await ExportService.generateReport({
      format,
      type,
      dateRange,
      filters,
      groupBy
    });

    // Set response headers
    res.setHeader('Content-Type', format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    res.setHeader('Content-Disposition', 
      `attachment; filename=report-${type}-${new Date().toISOString()}.${format}`
    );

    res.send(buffer);
  } catch (error) {
    logger.error('Error generating report:', error);
    throw error;
  }
};