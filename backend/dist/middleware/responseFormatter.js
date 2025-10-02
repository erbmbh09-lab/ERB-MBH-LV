"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorFormatter = exports.responseFormatter = void 0;
const logger_1 = require("../utils/logger");
const responseFormatter = (req, res, next) => {
    // Store the original res.json function
    const originalJson = res.json;
    // Override res.json to format the response
    res.json = function (data) {
        let formattedResponse;
        // Check if the response is already formatted
        if (data?.status && (data?.data || data?.error)) {
            formattedResponse = data;
        }
        else {
            formattedResponse = {
                status: 'success',
                data
            };
        }
        // Add pagination meta if available
        if (data?.meta?.pagination) {
            formattedResponse.meta = data.meta;
        }
        // Log the response for monitoring
        logger_1.logger.debug('API Response:', {
            path: req.path,
            method: req.method,
            status: formattedResponse.status,
            timestamp: new Date().toISOString()
        });
        return originalJson.call(this, formattedResponse);
    };
    next();
};
exports.responseFormatter = responseFormatter;
const errorFormatter = (error, req, res, next) => {
    logger_1.logger.error('API Error:', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    const formattedError = {
        status: 'error',
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'حدث خطأ داخلي في النظام',
            details: error.details || undefined
        }
    };
    res.status(error.status || 500).json(formattedError);
};
exports.errorFormatter = errorFormatter;
//# sourceMappingURL=responseFormatter.js.map