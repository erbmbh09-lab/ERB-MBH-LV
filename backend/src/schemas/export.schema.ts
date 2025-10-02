import { z } from 'zod';

export const exportParamsSchema = z.object({
  format: z.enum(['pdf', 'excel'], {
    required_error: 'صيغة التصدير مطلوبة',
    invalid_type_error: 'صيغة التصدير يجب أن تكون pdf أو excel'
  }),
  
  type: z.enum(['task', 'timesheet', 'billing'], {
    required_error: 'نوع التقرير مطلوب',
    invalid_type_error: 'نوع التقرير غير صالح'
  }),
  
  dateRange: z.object({
    from: z.string()
      .refine(date => !isNaN(Date.parse(date)), {
        message: 'تاريخ البداية غير صالح'
      }),
    to: z.string()
      .refine(date => !isNaN(Date.parse(date)), {
        message: 'تاريخ النهاية غير صالح'
      })
  }).optional(),
  
  filters: z.object({
    status: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    assigneeId: z.number().optional()
  }).optional(),
  
  groupBy: z.enum(['user', 'category', 'status']).optional()
});

export const validateExportParams = (params: unknown) => {
  return exportParamsSchema.parse(params);
};

// Additional validation rules for billing
export const billingValidationRules = z.object({
  rateType: z.enum(['hourly', 'fixed', 'non-billable'], {
    required_error: 'نوع التسعير مطلوب',
    invalid_type_error: 'نوع التسعير غير صالح'
  }),
  
  rate: z.number({
    required_error: 'معدل التسعير مطلوب',
    invalid_type_error: 'معدل التسعير يجب أن يكون رقماً'
  }).min(0, 'معدل التسعير يجب أن يكون أكبر من صفر')
    .refine(rate => rate % 0.25 === 0, {
      message: 'معدل التسعير يجب أن يكون مضاعفاً لـ 0.25'
    }),
  
  currency: z.enum(['USD', 'AED', 'SAR'], {
    required_error: 'العملة مطلوبة',
    invalid_type_error: 'العملة غير صالحة'
  }),
  
  minHours: z.number()
    .min(0.25, 'الحد الأدنى للساعات يجب أن يكون 15 دقيقة على الأقل')
    .optional(),
    
  maxHoursPerDay: z.number()
    .max(24, 'الحد الأقصى للساعات في اليوم لا يمكن أن يتجاوز 24 ساعة')
    .optional(),
    
  allowOvertime: z.boolean().optional(),
  
  roundingRule: z.enum(['nearest', 'up', 'down'])
    .default('nearest')
});

// Time tracking validation
export const timeTrackingValidationRules = z.object({
  date: z.string()
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح'
    })
    .refine(date => new Date(date) <= new Date(), {
      message: 'لا يمكن تسجيل وقت في المستقبل'
    }),
    
  hours: z.number()
    .min(0.25, 'أقل وقت يمكن تسجيله هو 15 دقيقة')
    .max(24, 'لا يمكن تسجيل أكثر من 24 ساعة في اليوم')
    .refine(hours => hours % 0.25 === 0, {
      message: 'يجب تسجيل الوقت بمضاعفات 15 دقيقة'
    }),
    
  description: z.string()
    .min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل')
    .max(500, 'الوصف لا يمكن أن يتجاوز 500 حرف'),
    
  billable: z.boolean(),
  
  category: z.enum([
    'development',
    'meeting',
    'research',
    'documentation',
    'support',
    'other'
  ]).optional(),
  
  overlapping: z.boolean()
    .default(false)
    .refine(value => !value, {
      message: 'لا يمكن تسجيل أوقات متداخلة'
    })
});