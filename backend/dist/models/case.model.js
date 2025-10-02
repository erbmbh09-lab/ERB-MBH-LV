"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Case = void 0;
const mongoose_1 = require("mongoose");
const caseSchema = new mongoose_1.Schema({
    caseNumber: { type: String, required: true, unique: true },
    court: { type: String, required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    value: { type: Number, required: true },
    assignedLawyerId: { type: Number, required: true },
    assistantLawyerId: Number,
    parties: [{
            clientId: { type: Number, required: true },
            capacity: {
                type: String,
                required: true,
                enum: ['client', 'opponent']
            }
        }],
    status: {
        type: String,
        required: true,
        enum: ['active', 'closed', 'suspended'],
        default: 'active'
    },
    priority: {
        type: String,
        required: true,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },
    openDate: { type: String, required: true },
    closeDate: String,
    litigationStages: [{
            degree: { type: String, required: true },
            caseNumber: { type: String, required: true },
            year: { type: String, required: true },
            clientCapacity: { type: String, required: true },
            opponentCapacity: { type: String, required: true },
            referralDate: { type: String, required: true }
        }],
    judicialAnnouncements: [{
            title: { type: String, required: true },
            issueDate: { type: String, required: true },
            legalPeriod: { type: String, required: true }
        }],
    petitionOrders: [{
            submissionDate: { type: String, required: true },
            orderType: { type: String, required: true },
            judgeDecision: {
                type: String,
                required: true,
                enum: ['accepted', 'rejected', 'pending']
            },
            legalPeriod: { type: String, required: true }
        }],
    executions: [{
            date: { type: String, required: true },
            type: { type: String, required: true },
            status: {
                type: String,
                required: true,
                enum: ['قيد التنفيذ', 'منفذ', 'متوقف']
            },
            amount: { type: String, required: true }
        }],
    memos: [{
            title: { type: String, required: true },
            content: { type: String, required: true },
            status: {
                type: String,
                required: true,
                enum: ['draft', 'pending_approval', 'approved', 'rejected', 'submitted']
            },
            deadline: { type: String, required: true },
            managerNotes: String
        }],
    documents: [{
            title: { type: String, required: true },
            type: { type: String, required: true },
            uploadDate: { type: String, required: true },
            uploadedBy: { type: Number, required: true },
            fileUrl: { type: String, required: true },
            notes: String
        }],
    linkedCases: [String],
    notes: String
}, {
    timestamps: true
});
// Indexes for efficient queries
caseSchema.index({ caseNumber: 1 });
caseSchema.index({ assignedLawyerId: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ 'parties.clientId': 1 });
caseSchema.index({ openDate: 1, closeDate: 1 });
exports.Case = (0, mongoose_1.model)('Case', caseSchema);
//# sourceMappingURL=case.model.js.map