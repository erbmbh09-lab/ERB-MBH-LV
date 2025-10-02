import { LegalDeadline } from '../models/legal-deadline.model';
import { Case } from '../models/case.model';
import { logger } from '../utils/logger';

export class LegalDeadlineService {
  static async createDeadlineFromPetition(
    caseId: string,
    caseNumber: string,
    client: string,
    isAccepted: boolean
  ) {
    try {
      const deadline = await LegalDeadline.create({
        caseId,
        caseNumber,
        client,
        judgmentDate: new Date().toISOString().split('T')[0],
        deadlineInDays: isAccepted ? 8 : 7,
        actionRequired: isAccepted ? 'تسجيل الدعوى رسمياً' : 'تقديم تظلم',
        stage: isAccepted ? 'عريضة مقبولة' : 'عريضة مرفوضة'
      });

      logger.info(`Created legal deadline for petition response: ${deadline.id}`);
      return deadline;
    } catch (error) {
      logger.error('Error creating legal deadline for petition:', error);
      throw error;
    }
  }

  static async createDeadlineFromJudgment(
    caseId: string,
    caseNumber: string,
    client: string,
    isCriminal: boolean,
    isAppealJudgment: boolean
  ) {
    try {
      const deadlineInDays = isCriminal ? 15 : 30;
      const actionRequired = isAppealJudgment ? 'تقديم طعن' : 'تقديم استئناف';
      const stage = isAppealJudgment ? 'حكم استئناف' : 'حكم ابتدائي';

      const deadline = await LegalDeadline.create({
        caseId,
        caseNumber,
        client,
        judgmentDate: new Date().toISOString().split('T')[0],
        deadlineInDays,
        actionRequired,
        stage
      });

      logger.info(`Created legal deadline for judgment: ${deadline.id}`);
      return deadline;
    } catch (error) {
      logger.error('Error creating legal deadline for judgment:', error);
      throw error;
    }
  }

  static async getDeadlinesForCase(caseNumber: string) {
    try {
      return await LegalDeadline.find({ caseNumber }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting deadlines for case:', error);
      throw error;
    }
  }

  static async getAllActiveDeadlines() {
    try {
      const today = new Date();
      const deadlines = await LegalDeadline.find({}).sort({ judgmentDate: 1 });
      
      // Filter out expired deadlines and calculate remaining days
      return deadlines.filter(deadline => {
        const judgmentDate = new Date(deadline.judgmentDate);
        const deadlineDate = new Date(judgmentDate);
        deadlineDate.setDate(deadlineDate.getDate() + deadline.deadlineInDays);
        return deadlineDate >= today;
      });
    } catch (error) {
      logger.error('Error getting active deadlines:', error);
      throw error;
    }
  }
}