"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeTrackingValidationRules = exports.billingValidationRules = exports.validateExportParams = exports.exportParamsSchema = void 0;
const zod_1 = require("zod");
exports.exportParamsSchema = zod_1.z.object({
    format: zod_1.z.enum(['pdf', 'excel'], {
        required_error: 'صيغة التصدير مطلوبة',
        invalid_type_error: 'صيغة التصدير يجب أن تكون pdf أو excel'
    }),
    type: zod_1.z.enum(['task', 'timesheet', 'billing'], {
        required_error: 'نوع التقرير مطلوب',
        invalid_type_error: 'نوع التقرير غير صالح'
    }),
    dateRange: zod_1.z.object({
        from: zod_1.z.string()
            .refine(date => !isNaN(Date.parse(date)), {
            message: 'تاريخ البداية غير صالح'
        }),
        to: zod_1.z.string()
            .refine(date => !isNaN(Date.parse(date)), {
            message: 'تاريخ النهاية غير صالح'
        })
    }).optional(),
    filters: zod_1.z.object({
        status: zod_1.z.array(zod_1.z.string()).optional(),
        category: zod_1.z.array(zod_1.z.string()).optional(),
        assigneeId: zod_1.z.number().optional()
    }).optional(),
    groupBy: zod_1.z.enum(['user', 'category', 'status']).optional()
});
const validateExportParams = (params) => {
    return exports.exportParamsSchema.parse(params);
};
exports.validateExportParams = validateExportParams;
// Additional validation rules for billing
exports.billingValidationRules = zod_1.z.object({
    rateType: zod_1.z.enum(['hourly', 'fixed', 'non-billable'], {
        required_error: 'نوع التسعير مطلوب',
        invalid_type_error: 'نوع التسعير غير صالح'
    }),
    rate: zod_1.z.number({
        required_error: 'معدل التسعير مطلوب',
        invalid_type_error: 'معدل التسعير يجب أن يكون رقماً'
    }).min(0, 'معدل التسعير يجب أن يكون أكبر من صفر')
        .refine(rate => rate % 0.25 === 0, {
        message: 'معدل التسعير يجب أن يكون مضاعفاً لـ 0.25'
    }),
    currency: zod_1.z.enum(['USD', 'AED', 'SAR'], {
        required_error: 'العملة مطلوبة',
        invalid_type_error: 'العملة غير صالحة'
    }),
    minHours: zod_1.z.number()
        .min(0.25, 'الحد الأدنى للساعات يجب أن يكون 15 دقيقة على الأقل')
        .optional(),
    maxHoursPerDay: zod_1.z.number()
        .max(24, 'الحد الأقصى للساعات في اليوم لا يمكن أن يتجاوز 24 ساعة')
        .optional(),
    allowOvertime: zod_1.z.boolean().optional(),
    roundingRule: zod_1.z.enum(['nearest', 'up', 'down'])
        .default('nearest')
});
// Time tracking validation
exports.timeTrackingValidationRules = zod_1.z.object({
    date: zod_1.z.string()
        .refine(date => !isNaN(Date.parse(date)), {
        message: 'التاريخ غير صالح'
    })
        .refine(date => new Date(date) <= new Date(), {
        message: 'لا يمكن تسجيل وقت في المستقبل'
    }),
    hours: zod_1.z.number()
        .min(0.25, 'أقل وقت يمكن تسجيله هو 15 دقيقة')
        .max(24, 'لا يمكن تسجيل أكثر من 24 ساعة في اليوم')
        .refine(hours => hours % 0.25 === 0, {
        message: 'يجب تسجيل الوقت بمضاعفات 15 دقيقة'
    }),
    description: zod_1.z.string()
        .min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل')
        .max(500, 'الوصف لا يمكن أن يتجاوز 500 حرف'),
    billable: zod_1.z.boolean(),
    category: zod_1.z.enum([
        'development',
        'meeting',
        'research',
        'documentation',
        'support',
        'other'
    ]).optional(),
    overlapping: zod_1.z.boolean()
        .default(false)
        .refine(value => !value, {
        message: 'لا يمكن تسجيل أوقات متداخلة'
    })
});
//# sourceMappingURL=export.schema.js.map