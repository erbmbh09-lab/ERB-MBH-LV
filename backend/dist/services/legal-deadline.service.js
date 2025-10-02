"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDeadlineService = void 0;
const legal_deadline_model_1 = require("../models/legal-deadline.model");
const logger_1 = require("../utils/logger");
class LegalDeadlineService {
    static async createDeadlineFromPetition(caseId, caseNumber, client, isAccepted) {
        try {
            const deadline = await legal_deadline_model_1.LegalDeadline.create({
                caseId,
                caseNumber,
                client,
                judgmentDate: new Date().toISOString().split('T')[0],
                deadlineInDays: isAccepted ? 8 : 7,
                actionRequired: isAccepted ? 'تسجيل الدعوى رسمياً' : 'تقديم تظلم',
                stage: isAccepted ? 'عريضة مقبولة' : 'عريضة مرفوضة'
            });
            logger_1.logger.info(`Created legal deadline for petition response: ${deadline.id}`);
            return deadline;
        }
        catch (error) {
            logger_1.logger.error('Error creating legal deadline for petition:', error);
            throw error;
        }
    }
    static async createDeadlineFromJudgment(caseId, caseNumber, client, isCriminal, isAppealJudgment) {
        try {
            const deadlineInDays = isCriminal ? 15 : 30;
            const actionRequired = isAppealJudgment ? 'تقديم طعن' : 'تقديم استئناف';
            const stage = isAppealJudgment ? 'حكم استئناف' : 'حكم ابتدائي';
            const deadline = await legal_deadline_model_1.LegalDeadline.create({
                caseId,
                caseNumber,
                client,
                judgmentDate: new Date().toISOString().split('T')[0],
                deadlineInDays,
                actionRequired,
                stage
            });
            logger_1.logger.info(`Created legal deadline for judgment: ${deadline.id}`);
            return deadline;
        }
        catch (error) {
            logger_1.logger.error('Error creating legal deadline for judgment:', error);
            throw error;
        }
    }
    static async getDeadlinesForCase(caseNumber) {
        try {
            return await legal_deadline_model_1.LegalDeadline.find({ caseNumber }).sort({ createdAt: -1 });
        }
        catch (error) {
            logger_1.logger.error('Error getting deadlines for case:', error);
            throw error;
        }
    }
    static async getAllActiveDeadlines() {
        try {
            const today = new Date();
            const deadlines = await legal_deadline_model_1.LegalDeadline.find({}).sort({ judgmentDate: 1 });
            // Filter out expired deadlines and calculate remaining days
            return deadlines.filter(deadline => {
                const judgmentDate = new Date(deadline.judgmentDate);
                const deadlineDate = new Date(judgmentDate);
                deadlineDate.setDate(deadlineDate.getDate() + deadline.deadlineInDays);
                return deadlineDate >= today;
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting active deadlines:', error);
            throw error;
        }
    }
}
exports.LegalDeadlineService = LegalDeadlineService;
//# sourceMappingURL=legal-deadline.service.js.map