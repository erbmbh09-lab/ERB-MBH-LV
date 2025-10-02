"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingReport = exports.getTimeReport = exports.updateBillingInfo = exports.addTimeEntry = void 0;
const time_tracking_service_1 = require("../services/time-tracking.service");
const logger_1 = require("../utils/logger");
const addTimeEntry = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { date, hours, description, billable = true } = req.body;
        const task = await time_tracking_service_1.TimeTrackingService.addTimeEntry(taskId, {
            date,
            hours,
            description,
            billable,
            userId: req.user.employeeId
        });
        res.json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding time entry:', error);
        throw error;
    }
};
exports.addTimeEntry = addTimeEntry;
const updateBillingInfo = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { rateType, rate, currency } = req.body;
        const task = await time_tracking_service_1.TimeTrackingService.updateBillingInfo(taskId, req.user.employeeId, { rateType, rate, currency });
        res.json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating billing info:', error);
        throw error;
    }
};
exports.updateBillingInfo = updateBillingInfo;
const getTimeReport = async (req, res) => {
    try {
        const { startDate, endDate, userId, billableOnly, groupBy } = req.query;
        const report = await time_tracking_service_1.TimeTrackingService.generateTimeReport({
            startDate: startDate,
            endDate: endDate,
            userId: userId ? parseInt(userId) : undefined,
            billableOnly: billableOnly === 'true',
            groupBy: groupBy
        });
        res.json({
            status: 'success',
            data: { report }
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating time report:', error);
        throw error;
    }
};
exports.getTimeReport = getTimeReport;
const getBillingReport = async (req, res) => {
    try {
        const { startDate, endDate, currency } = req.query;
        const report = await time_tracking_service_1.TimeTrackingService.generateBillingReport({
            startDate: startDate,
            endDate: endDate,
            currency: currency
        });
        res.json({
            status: 'success',
            data: { report }
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating billing report:', error);
        throw error;
    }
};
exports.getBillingReport = getBillingReport;
//# sourceMappingURL=time-tracking.controller.js.map