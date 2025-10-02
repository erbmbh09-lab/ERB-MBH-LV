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
const CaseController = __importStar(require("../controllers/case.controller"));
const LegalDeadlineController = __importStar(require("../controllers/legal-deadline.controller"));
const router = (0, express_1.Router)();
// Get all cases (with optional filters)
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.query']), CaseController.getCases);
// Get a specific case
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.query']), CaseController.getCaseById);
// Create a new case
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.create']), CaseController.createCase);
// Update a case
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.update']), CaseController.updateCase);
// Link multiple cases
router.post('/link', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.update']), CaseController.linkCases);
// Delete a case
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.delete']), CaseController.deleteCase);
// Get legal deadlines
router.get('/legal-deadlines', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['case.query']), LegalDeadlineController.getLegalDeadlines);
exports.default = router;
//# sourceMappingURL=case.routes.js.map