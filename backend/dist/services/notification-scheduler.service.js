"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notification_service_1 = require("../services/notification.service");
const employee_model_1 = require("../models/employee.model");
const case_model_1 = require("../models/case.model");
const logger_1 = require("../utils/logger");
class NotificationScheduler {
    // Run every day at midnight
    static initializeScheduler() {
        // Clean up expired notifications daily
        node_cron_1.default.schedule('0 0 * * *', async () => {
            try {
                await notification_service_1.NotificationService.deleteExpiredNotifications();
            }
            catch (error) {
                logger_1.logger.error('Error in notification cleanup job:', error);
            }
        });
        // Check for document expirations daily
        node_cron_1.default.schedule('0 1 * * *', async () => {
            try {
                await this.checkDocumentExpirations();
            }
            catch (error) {
                logger_1.logger.error('Error in document expiration check job:', error);
            }
        });
        // Check for case deadlines every 6 hours
        node_cron_1.default.schedule('0 */6 * * *', async () => {
            try {
                await this.checkCaseDeadlines();
            }
            catch (error) {
                logger_1.logger.error('Error in case deadline check job:', error);
            }
        });
        logger_1.logger.info('Notification scheduler initialized');
    }
    static async checkDocumentExpirations() {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const employees = await employee_model_1.Employee.find({
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
                        await notification_service_1.NotificationService.createDocumentExpiryNotification(doc.type, employee.id, expiryDate);
                    }
                }
            }
        }
    }
    static async checkCaseDeadlines() {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        // Find cases with upcoming deadlines
        const cases = await case_model_1.Case.find({
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
                    await notification_service_1.NotificationService.createDeadlineNotification(caseItem._id.toString(), caseItem.assignedLawyerId, 'Upcoming Litigation Stage Deadline', `Case ${caseItem.caseNumber} has a litigation stage deadline approaching on ${stage.referralDate}`, referralDate);
                }
            }
            // Check judicial announcement deadlines
            for (const announcement of caseItem.judicialAnnouncements) {
                const issueDate = new Date(announcement.issueDate);
                if (issueDate <= sevenDaysFromNow) {
                    await notification_service_1.NotificationService.createDeadlineNotification(caseItem._id.toString(), caseItem.assignedLawyerId, 'Upcoming Judicial Announcement', `Case ${caseItem.caseNumber} has a judicial announcement deadline on ${announcement.issueDate}`, issueDate);
                }
            }
        }
    }
}
exports.NotificationScheduler = NotificationScheduler;
//# sourceMappingURL=notification-scheduler.service.js.map