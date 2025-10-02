"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    employeeId: { type: Number },
    clientId: { type: Number },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['CASE', 'TASK', 'DOCUMENT', 'DEADLINE', 'HR', 'SYSTEM']
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        required: true,
        enum: ['unread', 'read', 'archived'],
        default: 'unread'
    },
    relatedTo: {
        type: {
            type: String,
            enum: ['case', 'task', 'document', 'employee', 'client']
        },
        id: String
    },
    actionRequired: String,
    expiresAt: Date,
    readAt: Date
}, {
    timestamps: true
});
// Indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ employeeId: 1 });
notificationSchema.index({ clientId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ expiresAt: 1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
//# sourceMappingURL=notification.model.js.map