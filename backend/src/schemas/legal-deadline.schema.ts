import { z } from 'zod';

export const legalDeadlineSchema = z.object({
  caseId: z.string({
    required_error: 'معرف القضية مطلوب',
    invalid_type_error: 'معرف القضية يجب أن يكون نصاً'
  }),

  title: z.string()
    .min(3, 'عنوان الموعد يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'عنوان الموعد لا يمكن أن يتجاوز 200 حرف'),

  description: z.string()
    .min(10, 'وصف الموعد يجب أن يكون 10 أحرف على الأقل')
    .max(1000, 'وصف الموعد لا يمكن أن يتجاوز 1000 حرف'),

  deadlineDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'تاريخ الموعد غير صالح'
    })
    .refine(date => new Date(date) > new Date(), {
      message: 'تاريخ الموعد يجب أن يكون في المستقبل'
    }),

  type: z.enum(['hearing', 'submission', 'appeal', 'response', 'other'], {
    errorMap: () => ({ message: 'نوع الموعد غير صالح' })
  }),

  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'أولوية الموعد غير صالحة' })
  }),

  assigneeId: z.number({
    required_error: 'معرف المسؤول مطلوب',
    invalid_type_error: 'معرف المسؤول يجب أن يكون رقماً'
  }),

  reminders: z.array(z.object({
    type: z.enum(['email', 'notification', 'sms'], {
      errorMap: () => ({ message: 'نوع التذكير غير صالح' })
    }),
    beforeDue: z.number()
      .min(5, 'وقت التذكير يجب أن يكون 5 دقائق على الأقل')
      .max(30 * 24 * 60, 'وقت التذكير لا يمكن أن يتجاوز 30 يوماً'),
    recipients: z.array(z.number())
      .min(1, 'يجب تحديد مستلم واحد على الأقل')
  })).optional(),

  documents: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url('رابط الملف غير صالح'),
    fileType: z.string(),
    fileSize: z.number()
      .max(20 * 1024 * 1024, 'حجم الملف لا يمكن أن يتجاوز 20 ميجابايت')
  })).optional(),

  notes: z.string().max(500, 'الملاحظات لا يمكن أن تتجاوز 500 حرف').optional()
});

// Schema for updating deadline status
export const deadlineStatusSchema = z.object({
  status: z.enum([
    'new',
    'in-progress',
    'completed',
    'at-risk',
    'overdue',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'حالة الموعد غير صالحة' })
  }),

  progress: z.number()
    .min(0, 'نسبة التقدم يجب أن تكون بين 0 و 100')
    .max(100, 'نسبة التقدم يجب أن تكون بين 0 و 100')
    .optional(),

  notes: z.string().max(500, 'الملاحظات لا يمكن أن تتجاوز 500 حرف').optional()
});

// Schema for querying upcoming deadlines
export const upcomingDeadlinesSchema = z.object({
  daysAhead: z.number()
    .min(1, 'عدد الأيام يجب أن يكون 1 على الأقل')
    .max(90, 'عدد الأيام لا يمكن أن يتجاوز 90 يوماً')
    .optional(),

  types: z.array(z.enum(['hearing', 'submission', 'appeal', 'response', 'other']))
    .optional(),

  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),

  status: z.array(z.enum([
    'new',
    'in-progress',
    'completed',
    'at-risk',
    'overdue',
    'cancelled'
  ])).optional(),

  assigneeId: z.number().optional()
});

export type CreateLegalDeadlineInput = z.infer<typeof legalDeadlineSchema>;
export type UpdateDeadlineStatusInput = z.infer<typeof deadlineStatusSchema>;
export type UpcomingDeadlinesQuery = z.infer<typeof upcomingDeadlinesSchema>;