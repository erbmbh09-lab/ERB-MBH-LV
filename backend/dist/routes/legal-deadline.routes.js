"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requestValidator_1 = require("../middleware/requestValidator");
const legal_deadline_schema_1 = require("../schemas/legal-deadline.schema");
const LegalDeadlineController = __importStar(require("../controllers/legal-deadline.controller"));
const router = (0, express_1.Router)();
// Create new legal deadline
router.post('/deadlines', auth_middleware_1.authenticate, (0, requestValidator_1.validateRequest)({ body: legal_deadline_schema_1.legalDeadlineSchema }), LegalDeadlineController.createDeadline);
// Update deadline status
router.put('/deadlines/:taskId/status', auth_middleware_1.authenticate, (0, requestValidator_1.validateRequest)({ body: legal_deadline_schema_1.deadlineStatusSchema }), LegalDeadlineController.updateDeadlineStatus);
// Get upcoming deadlines
router.get('/deadlines/upcoming', auth_middleware_1.authenticate, (0, requestValidator_1.validateRequest)({ query: legal_deadline_schema_1.upcomingDeadlinesSchema }), LegalDeadlineController.getUpcomingDeadlines);
exports.default = router;
//# sourceMappingURL=legal-deadline.routes.js.map