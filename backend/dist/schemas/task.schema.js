"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskUpdateSchema = exports.taskSchema = void 0;
const zod_1 = require("zod");
const commentSchema = zod_1.z.object({
    authorId: zod_1.z.number({
        required_error: 'معرف الكاتب مطلوب',
        invalid_type_error: 'معرف الكاتب يجب أن يكون رقماً'
    }),
    content: zod_1.z.string().min(1, 'محتوى التعليق لا يمكن أن يكون فارغاً')
        .max(1000, 'محتوى التعليق لا يمكن أن يتجاوز 1000 حرف'),
    timestamp: zod_1.z.string({
        required_error: 'توقيت التعليق مطلوب',
        invalid_type_error: 'توقيت التعليق يجب أن يكون نصاً'
    }).refine((date) => !isNaN(Date.parse(date)), { message: 'توقيت التعليق غير صالح' }),
    attachments: zod_1.z.array(zod_1.z.object({
        fileName: zod_1.z.string(),
        fileUrl: zod_1.z.string().url('رابط الملف غير صالح'),
        fileType: zod_1.z.string(),
        fileSize: zod_1.z.number()
    })).optional(),
    mentions: zod_1.z.array(zod_1.z.number()).optional() // Array of employee IDs who are mentioned
});
const approvalStepSchema = zod_1.z.object({
    approverId: zod_1.z.number({
        required_error: 'معرف المراجع مطلوب',
        invalid_type_error: 'معرف المراجع يجب أن يكون رقماً'
    }),
    status: zod_1.z.enum(['pending', 'approved', 'rejected', 'changes-requested'], {
        errorMap: () => ({ message: 'حالة المراجعة غير صالحة' })
    }),
    actionDate: zod_1.z.string({
        required_error: 'تاريخ الإجراء مطلوب',
        invalid_type_error: 'تاريخ الإجراء يجب أن يكون نصاً'
    }).refine((date) => !isNaN(Date.parse(date)), { message: 'تاريخ الإجراء غير صالح' }),
    notes: zod_1.z.string().min(1, 'الملاحظات مطلوبة عند الرفض أو طلب التعديلات')
        .optional()
        .refine((notes, ctx) => {
        if (ctx.parent.status === 'rejected' || ctx.parent.status === 'changes-requested') {
            return notes !== undefined && notes.length > 0;
        }
        return true;
    }, { message: 'الملاحظات مطلوبة عند الرفض أو طلب التعديلات' }),
    changesRequired: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        description: zod_1.z.string(),
        severity: zod_1.z.enum(['minor', 'major', 'critical'])
    })).optional()
});
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'عنوان المهمة يجب أن يكون 3 أحرف على الأقل'),
    description: zod_1.z.string().min(10, 'وصف المهمة يجب أن يكون 10 أحرف على الأقل'),
    category: zod_1.z.enum([
        'legal-research', // بحث قانوني
        'document-review', // مراجعة مستندات
        'court-preparation', // تحضير للمحكمة
        'client-communication', // تواصل مع العملاء
        'administrative', // إداري
        'financial', // مالي
        'other' // أخرى
    ], {
        errorMap: () => ({ message: 'تصنيف المهمة غير صالح' })
    }),
    type: zod_1.z.enum(['personal', 'assigned'], {
        errorMap: () => ({ message: 'نوع المهمة يجب أن يكون شخصي أو مُسند' })
    }),
    templateId: zod_1.z.string().optional(), // For tasks created from templates
    status: zod_1.z.enum([
        'draft', // مسودة
        'new', // جديدة
        'in-progress', // قيد التنفيذ
        'pending-approval', // في انتظار الموافقة
        'approved', // تمت الموافقة
        'completed', // مكتملة
        'rejected', // مرفوضة
        'cancelled' // ملغاة
    ], {
        errorMap: () => ({ message: 'حالة المهمة غير صالحة' })
    }),
    priority: zod_1.z.enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'أولوية المهمة يجب أن تكون منخفضة، متوسطة، أو عالية' })
    }),
    assignerId: zod_1.z.number({
        required_error: 'معرف المسند مطلوب',
        invalid_type_error: 'معرف المسند يجب أن يكون رقماً'
    }),
    assigneeId: zod_1.z.number({
        required_error: 'معرف المسند إليه مطلوب',
        invalid_type_error: 'معرف المسند إليه يجب أن يكون رقماً'
    }),
    createdAt: zod_1.z.string({
        required_error: 'تاريخ الإنشاء مطلوب',
        invalid_type_error: 'تاريخ الإنشاء يجب أن يكون نصاً'
    }),
    dueDate: zod_1.z.string({
        required_error: 'تاريخ الاستحقاق مطلوب',
        invalid_type_error: 'تاريخ الاستحقاق يجب أن يكون نصاً'
    }).refine((date) => !isNaN(Date.parse(date)), { message: 'تاريخ الاستحقاق غير صالح' }),
    completedAt: zod_1.z.string().optional(),
    relatedCaseId: zod_1.z.string().optional(),
    comments: zod_1.z.array(commentSchema).optional(),
    approvalWorkflow: zod_1.z.array(approvalStepSchema).optional(),
    // Time tracking
    estimatedHours: zod_1.z.number({
        required_error: 'الوقت المقدر مطلوب',
        invalid_type_error: 'الوقت المقدر يجب أن يكون رقماً'
    }).min(0.5, 'الوقت المقدر يجب أن يكون 30 دقيقة على الأقل'),
    actualHours: zod_1.z.number().optional(),
    timeEntries: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        hours: zod_1.z.number().min(0.25, 'أقل وقت يمكن تسجيله هو 15 دقيقة'),
        description: zod_1.z.string(),
        billable: zod_1.z.boolean().default(true)
    })).optional(),
    // Progress tracking
    progress: zod_1.z.number().min(0).max(100).optional(),
    milestones: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        dueDate: zod_1.z.string(),
        status: zod_1.z.enum(['pending', 'completed', 'overdue']),
        completedAt: zod_1.z.string().optional()
    })).optional(),
    // Dependencies
    dependencies: zod_1.z.array(zod_1.z.object({
        taskId: zod_1.z.string(),
        type: zod_1.z.enum(['blocks', 'blocked-by', 'related-to']),
        notes: zod_1.z.string().optional()
    })).optional(),
    // Workflow specific fields
    workflow: zod_1.z.object({
        currentStep: zod_1.z.number().min(1),
        totalSteps: zod_1.z.number().min(1),
        sequence: zod_1.z.array(zod_1.z.object({
            step: zod_1.z.number().min(1),
            name: zod_1.z.string(),
            type: zod_1.z.enum(['review', 'approval', 'notification']),
            assigneeId: zod_1.z.number(),
            status: zod_1.z.enum(['pending', 'completed', 'skipped']),
            completedAt: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional()
        })),
        autoAdvance: zod_1.z.boolean().default(true),
        allowSkip: zod_1.z.boolean().default(false),
        requireAllApprovals: zod_1.z.boolean().default(true)
    }).optional(),
    // Court related fields
    courtInfo: zod_1.z.object({
        caseNumber: zod_1.z.string().optional(),
        courtName: zod_1.z.string().optional(),
        hearingDate: zod_1.z.string().optional(),
        deadline: zod_1.z.string().optional(),
        requiredDocuments: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    // Billing information
    billing: zod_1.z.object({
        billable: zod_1.z.boolean().default(true),
        rateType: zod_1.z.enum(['hourly', 'fixed', 'non-billable']),
        rate: zod_1.z.number().optional(),
        currency: zod_1.z.enum(['USD', 'AED', 'SAR']).optional(),
        invoiceId: zod_1.z.string().optional()
    }).optional(),
    // Recurrence settings
    recurrence: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        pattern: zod_1.z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
        interval: zod_1.z.number().optional(),
        daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
        endDate: zod_1.z.string().optional(),
        occurrences: zod_1.z.number().optional()
    }).optional(),
    // Reminder settings
    reminders: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['email', 'notification', 'sms']),
        beforeDue: zod_1.z.number(), // minutes before due date
        recipients: zod_1.z.array(zod_1.z.number()), // array of employee IDs
        message: zod_1.z.string().optional()
    })).optional(),
    // Audit trail
    auditTrail: zod_1.z.array(zod_1.z.object({
        action: zod_1.z.enum([
            'created',
            'updated',
            'status-changed',
            'assigned',
            'comment-added',
            'file-attached',
            'reminder-sent',
            'workflow-advanced'
        ]),
        timestamp: zod_1.z.string(),
        userId: zod_1.z.number(),
        details: zod_1.z.record(zod_1.z.any()).optional()
    })).optional()
});
exports.taskUpdateSchema = exports.taskSchema.partial().omit({ createdAt: true });
//# sourceMappingURL=task.schema.js.map