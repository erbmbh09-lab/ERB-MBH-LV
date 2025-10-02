"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = void 0;
const export_service_1 = require("../services/export.service");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const generateReport = async (req, res) => {
    try {
        const { format, type, dateRange, filters, groupBy } = (0, validation_1.validateExportParams)(req.query);
        const buffer = await export_service_1.ExportService.generateReport({
            format,
            type,
            dateRange,
            filters,
            groupBy
        });
        // Set response headers
        res.setHeader('Content-Type', format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString()}.${format}`);
        res.send(buffer);
    }
    catch (error) {
        logger_1.logger.error('Error generating report:', error);
        throw error;
    }
};
exports.generateReport = generateReport;
//# sourceMappingURL=export.controller.js.map