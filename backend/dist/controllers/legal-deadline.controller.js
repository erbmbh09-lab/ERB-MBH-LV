"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegalDeadlines = void 0;
const legal_deadline_service_1 = require("../services/legal-deadline.service");
const logger_1 = require("../utils/logger");
const getLegalDeadlines = async (req, res) => {
    try {
        const { caseNumber } = req.query;
        let deadlines;
        if (caseNumber) {
            deadlines = await legal_deadline_service_1.LegalDeadlineService.getDeadlinesForCase(caseNumber);
        }
        else {
            deadlines = await legal_deadline_service_1.LegalDeadlineService.getAllActiveDeadlines();
        }
        res.json({
            status: 'success',
            data: { deadlines }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting legal deadlines:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getLegalDeadlines = getLegalDeadlines;
//# sourceMappingURL=legal-deadline.controller.js.map