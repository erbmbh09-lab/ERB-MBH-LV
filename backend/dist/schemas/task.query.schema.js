"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskBulkOperationSchema = exports.taskQuerySchema = void 0;
const zod_1 = require("zod");
// Schema for task search and filter parameters
exports.taskQuerySchema = zod_1.z.object({
    // Pagination
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(20),
    // Sorting
    sortBy: zod_1.z.enum([
        'dueDate',
        'createdAt',
        'priority',
        'status',
        'title',
        'progress'
    ]).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    // Filters
    status: zod_1.z.enum([
        'draft',
        'new',
        'in-progress',
        'pending-approval',
        'approved',
        'completed',
        'rejected',
        'cancelled'
    ]).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    category: zod_1.z.enum([
        'legal-research',
        'document-review',
        'court-preparation',
        'client-communication',
        'administrative',
        'financial',
        'other'
    ]).optional(),
    type: zod_1.z.enum(['personal', 'assigned']).optional(),
    // Date Range
    dateFrom: zod_1.z.string()
        .refine(date => !isNaN(Date.parse(date)), {
        message: 'تاريخ البداية غير صالح'
    }).optional(),
    dateTo: zod_1.z.string()
        .refine(date => !isNaN(Date.parse(date)), {
        message: 'تاريخ النهاية غير صالح'
    }).optional(),
    // Search
    search: zod_1.z.string().optional(),
    searchFields: zod_1.z.array(zod_1.z.enum(['title', 'description', 'comments'])).optional(),
    // Assignment Filters
    assigneeId: zod_1.z.number().optional(),
    assignerId: zod_1.z.number().optional(),
    myTasks: zod_1.z.boolean().optional(), // Filter for current user's tasks
    // Related Items
    relatedCaseId: zod_1.z.string().optional(),
    hasAttachments: zod_1.z.boolean().optional(),
    hasDependencies: zod_1.z.boolean().optional(),
    // Progress
    progressMin: zod_1.z.number().min(0).max(100).optional(),
    progressMax: zod_1.z.number().min(0).max(100).optional(),
    // Time Range
    dueSoon: zod_1.z.number().optional(), // Days until due
    overdue: zod_1.z.boolean().optional(),
});
// Schema for bulk operations
exports.taskBulkOperationSchema = zod_1.z.object({
    taskIds: zod_1.z.array(zod_1.z.string()).min(1, 'يجب تحديد مهمة واحدة على الأقل'),
    operation: zod_1.z.enum([
        'update-status',
        'update-priority',
        'reassign',
        'delete'
    ]),
    value: zod_1.z.any(), // Value depends on operation type
    notes: zod_1.z.string().optional()
});
//# sourceMappingURL=task.query.schema.js.map