"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseUpdateSchema = exports.caseSchema = void 0;
const zod_1 = require("zod");
const partySchema = zod_1.z.object({
    clientId: zod_1.z.number(),
    capacity: zod_1.z.enum(['client', 'opponent'])
});
const litigationStageSchema = zod_1.z.object({
    degree: zod_1.z.string(),
    caseNumber: zod_1.z.string(),
    year: zod_1.z.string(),
    clientCapacity: zod_1.z.string(),
    opponentCapacity: zod_1.z.string(),
    referralDate: zod_1.z.string()
});
const judicialAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string(),
    issueDate: zod_1.z.string(),
    legalPeriod: zod_1.z.string()
});
const petitionOrderSchema = zod_1.z.object({
    submissionDate: zod_1.z.string(),
    orderType: zod_1.z.string(),
    judgeDecision: zod_1.z.enum(['accepted', 'rejected', 'pending']),
    legalPeriod: zod_1.z.string()
});
const executionSchema = zod_1.z.object({
    date: zod_1.z.string(),
    type: zod_1.z.string(),
    status: zod_1.z.enum(['قيد التنفيذ', 'منفذ', 'متوقف']),
    amount: zod_1.z.string()
});
const memoSchema = zod_1.z.object({
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    status: zod_1.z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'submitted']),
    deadline: zod_1.z.string(),
    managerNotes: zod_1.z.string().optional()
});
const documentSchema = zod_1.z.object({
    title: zod_1.z.string(),
    type: zod_1.z.string(),
    uploadDate: zod_1.z.string(),
    uploadedBy: zod_1.z.number(),
    fileUrl: zod_1.z.string(),
    notes: zod_1.z.string().optional()
});
exports.caseSchema = zod_1.z.object({
    caseNumber: zod_1.z.string(),
    court: zod_1.z.string(),
    type: zod_1.z.string(),
    subject: zod_1.z.string(),
    value: zod_1.z.number(),
    assignedLawyerId: zod_1.z.number(),
    assistantLawyerId: zod_1.z.number().optional(),
    parties: zod_1.z.array(partySchema),
    status: zod_1.z.enum(['active', 'closed', 'suspended']),
    priority: zod_1.z.enum(['normal', 'high', 'urgent']),
    openDate: zod_1.z.string(),
    closeDate: zod_1.z.string().optional(),
    litigationStages: zod_1.z.array(litigationStageSchema),
    judicialAnnouncements: zod_1.z.array(judicialAnnouncementSchema),
    petitionOrders: zod_1.z.array(petitionOrderSchema),
    executions: zod_1.z.array(executionSchema),
    memos: zod_1.z.array(memoSchema),
    documents: zod_1.z.array(documentSchema),
    linkedCases: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional()
});
exports.caseUpdateSchema = exports.caseSchema.partial().omit({ caseNumber: true });
//# sourceMappingURL=case.schema.js.map