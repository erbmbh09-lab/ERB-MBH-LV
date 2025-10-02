"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upcomingDeadlinesSchema = exports.deadlineStatusSchema = exports.legalDeadlineSchema = void 0;
const zod_1 = require("zod");
exports.legalDeadlineSchema = zod_1.z.object({
    caseId: zod_1.z.string({
        required_error: 'معرف القضية مطلوب',
        invalid_type_error: 'معرف القضية يجب أن يكون نصاً'
    }),
    title: zod_1.z.string()
        .min(3, 'عنوان الموعد يجب أن يكون 3 أحرف على الأقل')
        .max(200, 'عنوان الموعد لا يمكن أن يتجاوز 200 حرف'),
    description: zod_1.z.string()
        .min(10, 'وصف الموعد يجب أن يكون 10 أحرف على الأقل')
        .max(1000, 'وصف الموعد لا يمكن أن يتجاوز 1000 حرف'),
    deadlineDate: zod_1.z.string()
        .refine(date => !isNaN(Date.parse(date)), {
        message: 'تاريخ الموعد غير صالح'
    })
        .refine(date => new Date(date) > new Date(), {
        message: 'تاريخ الموعد يجب أن يكون في المستقبل'
    }),
    type: zod_1.z.enum(['hearing', 'submission', 'appeal', 'response', 'other'], {
        errorMap: () => ({ message: 'نوع الموعد غير صالح' })
    }),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical'], {
        errorMap: () => ({ message: 'أولوية الموعد غير صالحة' })
    }),
    assigneeId: zod_1.z.number({
        required_error: 'معرف المسؤول مطلوب',
        invalid_type_error: 'معرف المسؤول يجب أن يكون رقماً'
    }),
    reminders: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['email', 'notification', 'sms'], {
            errorMap: () => ({ message: 'نوع التذكير غير صالح' })
        }),
        beforeDue: zod_1.z.number()
            .min(5, 'وقت التذكير يجب أن يكون 5 دقائق على الأقل')
            .max(30 * 24 * 60, 'وقت التذكير لا يمكن أن يتجاوز 30 يوماً'),
        recipients: zod_1.z.array(zod_1.z.number())
            .min(1, 'يجب تحديد مستلم واحد على الأقل')
    })).optional(),
    documents: zod_1.z.array(zod_1.z.object({
        fileName: zod_1.z.string(),
        fileUrl: zod_1.z.string().url('رابط الملف غير صالح'),
        fileType: zod_1.z.string(),
        fileSize: zod_1.z.number()
            .max(20 * 1024 * 1024, 'حجم الملف لا يمكن أن يتجاوز 20 ميجابايت')
    })).optional(),
    notes: zod_1.z.string().max(500, 'الملاحظات لا يمكن أن تتجاوز 500 حرف').optional()
});
// Schema for updating deadline status
exports.deadlineStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'new',
        'in-progress',
        'completed',
        'at-risk',
        'overdue',
        'cancelled'
    ], {
        errorMap: () => ({ message: 'حالة الموعد غير صالحة' })
    }),
    progress: zod_1.z.number()
        .min(0, 'نسبة التقدم يجب أن تكون بين 0 و 100')
        .max(100, 'نسبة التقدم يجب أن تكون بين 0 و 100')
        .optional(),
    notes: zod_1.z.string().max(500, 'الملاحظات لا يمكن أن تتجاوز 500 حرف').optional()
});
// Schema for querying upcoming deadlines
exports.upcomingDeadlinesSchema = zod_1.z.object({
    daysAhead: zod_1.z.number()
        .min(1, 'عدد الأيام يجب أن يكون 1 على الأقل')
        .max(90, 'عدد الأيام لا يمكن أن يتجاوز 90 يوماً')
        .optional(),
    types: zod_1.z.array(zod_1.z.enum(['hearing', 'submission', 'appeal', 'response', 'other']))
        .optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: zod_1.z.array(zod_1.z.enum([
        'new',
        'in-progress',
        'completed',
        'at-risk',
        'overdue',
        'cancelled'
    ])).optional(),
    assigneeId: zod_1.z.number().optional()
});
//# sourceMappingURL=legal-deadline.schema.js.map