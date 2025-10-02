import cron from 'node-cron';
import { NotificationService } from '../services/notification.service';
import { Employee } from '../models/employee.model';
import { Case } from '../models/case.model';
import { logger } from '../utils/logger';

export class NotificationScheduler {
  // Run every day at midnight
  static initializeScheduler() {
    // Clean up expired notifications daily
    cron.schedule('0 0 * * *', async () => {
      try {
        await NotificationService.deleteExpiredNotifications();
      } catch (error) {
        logger.error('Error in notification cleanup job:', error);
      }
    });

    // Check for document expirations daily
    cron.schedule('0 1 * * *', async () => {
      try {
        await this.checkDocumentExpirations();
      } catch (error) {
        logger.error('Error in document expiration check job:', error);
      }
    });

    // Check for case deadlines every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        await this.checkCaseDeadlines();
      } catch (error) {
        logger.error('Error in case deadline check job:', error);
      }
    });

    logger.info('Notification scheduler initialized');
  }

  private static async checkDocumentExpirations() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const employees = await Employee.find({
      $or: [
        { 'documents.passport.expiry': { $lte: thirtyDaysFromNow } },
        { 'documents.emiratesId.expiry': { $lte: thirtyDaysFromNow } },
        { 'documents.workPermit.expiry': { $lte: thirtyDaysFromNow } },
        { 'documents.healthInsurance.expiry': { $lte: thirtyDaysFromNow } },
        { 'proCardExpiry': { $lte: thirtyDaysFromNow } }
      ]
    });

    for (const employee of employees) {
      // Check each document type
      const documents = [
        { type: 'Passport', expiry: employee.documents?.passport?.expiry },
        { type: 'Emirates ID', expiry: employee.documents?.emiratesId?.expiry },
        { type: 'Work Permit', expiry: employee.documents?.workPermit?.expiry },
        { type: 'Health Insurance', expiry: employee.documents?.healthInsurance?.expiry },
        { type: 'Professional Card', expiry: employee.proCardExpiry }
      ];

      for (const doc of documents) {
        if (doc.expiry) {
          const expiryDate = new Date(doc.expiry);
          if (expiryDate <= thirtyDaysFromNow) {
            await NotificationService.createDocumentExpiryNotification(
              doc.type,
              employee.id,
              expiryDate
            );
          }
        }
      }
    }
  }

  private static async checkCaseDeadlines() {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Find cases with upcoming deadlines
    const cases = await Case.find({
      status: 'active',
      $or: [
        { 'litigationStages.referralDate': { $lte: sevenDaysFromNow } },
        { 'judicialAnnouncements.issueDate': { $lte: sevenDaysFromNow } }
      ]
    });

    for (const caseItem of cases) {
      // Check litigation stage deadlines
      for (const stage of caseItem.litigationStages) {
        const referralDate = new Date(stage.referralDate);
        if (referralDate <= sevenDaysFromNow) {
          await NotificationService.createDeadlineNotification(
            caseItem._id.toString(),
            caseItem.assignedLawyerId,
            'Upcoming Litigation Stage Deadline',
            `Case ${caseItem.caseNumber} has a litigation stage deadline approaching on ${stage.referralDate}`,
            referralDate
          );
        }
      }

      // Check judicial announcement deadlines
      for (const announcement of caseItem.judicialAnnouncements) {
        const issueDate = new Date(announcement.issueDate);
        if (issueDate <= sevenDaysFromNow) {
          await NotificationService.createDeadlineNotification(
            caseItem._id.toString(),
            caseItem.assignedLawyerId,
            'Upcoming Judicial Announcement',
            `Case ${caseItem.caseNumber} has a judicial announcement deadline on ${announcement.issueDate}`,
            issueDate
          );
        }
      }
    }
  }
}