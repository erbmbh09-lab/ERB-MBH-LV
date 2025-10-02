"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['personal', 'assigned']
    },
    status: {
        type: String,
        required: true,
        enum: ['new', 'in-progress', 'pending-approval', 'completed', 'rejected'],
        default: 'new'
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignerId: { type: Number, required: true },
    assigneeId: { type: Number, required: true },
    createdAt: { type: String, required: true },
    dueDate: { type: String, required: true },
    completedAt: String,
    relatedCaseId: String,
    comments: [{
            authorId: { type: Number, required: true },
            content: { type: String, required: true },
            timestamp: { type: String, required: true }
        }],
    approvalWorkflow: [{
            approverId: { type: Number, required: true },
            status: {
                type: String,
                required: true,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            },
            approvedAt: String,
            notes: String
        }]
}, {
    timestamps: true
});
// Indexes for efficient queries
taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ assignerId: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ relatedCaseId: 1 });
exports.Task = (0, mongoose_1.model)('Task', taskSchema);
//# sourceMappingURL=task.model.js.map