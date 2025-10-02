"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDeadline = void 0;
const mongoose_1 = require("mongoose");
const legalDeadlineSchema = new mongoose_1.Schema({
    caseId: { type: String, required: true },
    caseNumber: { type: String, required: true },
    client: { type: String, required: true },
    judgmentDate: { type: String, required: true },
    deadlineInDays: { type: Number, required: true },
    actionRequired: {
        type: String,
        required: true,
        enum: ['تسجيل الدعوى رسمياً', 'تقديم تظلم', 'تقديم استئناف', 'تقديم طعن']
    },
    stage: {
        type: String,
        required: true,
        enum: ['عريضة مقبولة', 'عريضة مرفوضة', 'حكم ابتدائي', 'حكم استئناف']
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
legalDeadlineSchema.index({ caseNumber: 1 });
legalDeadlineSchema.index({ judgmentDate: 1 });
legalDeadlineSchema.index({ stage: 1 });
exports.LegalDeadline = (0, mongoose_1.model)('LegalDeadline', legalDeadlineSchema);
//# sourceMappingURL=legal-deadline.model.js.map