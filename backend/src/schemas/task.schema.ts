import { z } from 'zod';

const commentSchema = z.object({
  authorId: z.number({
    required_error: 'معرف الكاتب مطلوب',
    invalid_type_error: 'معرف الكاتب يجب أن يكون رقماً'
  }),
  content: z.string().min(1, 'محتوى التعليق لا يمكن أن يكون فارغاً')
    .max(1000, 'محتوى التعليق لا يمكن أن يتجاوز 1000 حرف'),
  timestamp: z.string({
    required_error: 'توقيت التعليق مطلوب',
    invalid_type_error: 'توقيت التعليق يجب أن يكون نصاً'
  }).refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'توقيت التعليق غير صالح' }
  ),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url('رابط الملف غير صالح'),
    fileType: z.string(),
    fileSize: z.number()
  })).optional(),
  mentions: z.array(z.number()).optional() // Array of employee IDs who are mentioned
});

const approvalStepSchema = z.object({
  approverId: z.number({
    required_error: 'معرف المراجع مطلوب',
    invalid_type_error: 'معرف المراجع يجب أن يكون رقماً'
  }),
  status: z.enum(['pending', 'approved', 'rejected', 'changes-requested'], {
    errorMap: () => ({ message: 'حالة المراجعة غير صالحة' })
  }),
  actionDate: z.string({
    required_error: 'تاريخ الإجراء مطلوب',
    invalid_type_error: 'تاريخ الإجراء يجب أن يكون نصاً'
  }).refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'تاريخ الإجراء غير صالح' }
  ),
  notes: z.string().min(1, 'الملاحظات مطلوبة عند الرفض أو طلب التعديلات')
    .optional()
    .refine(
      (notes, ctx) => {
        if (ctx.parent.status === 'rejected' || ctx.parent.status === 'changes-requested') {
          return notes !== undefined && notes.length > 0;
        }
        return true;
      },
      { message: 'الملاحظات مطلوبة عند الرفض أو طلب التعديلات' }
    ),
  changesRequired: z.array(z.object({
    field: z.string(),
    description: z.string(),
    severity: z.enum(['minor', 'major', 'critical'])
  })).optional()
});

export const taskSchema = z.object({
  title: z.string().min(3, 'عنوان المهمة يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().min(10, 'وصف المهمة يجب أن يكون 10 أحرف على الأقل'),
  category: z.enum([
    'legal-research',      // بحث قانوني
    'document-review',     // مراجعة مستندات
    'court-preparation',   // تحضير للمحكمة
    'client-communication',// تواصل مع العملاء
    'administrative',      // إداري
    'financial',          // مالي
    'other'               // أخرى
  ], {
    errorMap: () => ({ message: 'تصنيف المهمة غير صالح' })
  }),
  type: z.enum(['personal', 'assigned'], {
    errorMap: () => ({ message: 'نوع المهمة يجب أن يكون شخصي أو مُسند' })
  }),
  templateId: z.string().optional(),  // For tasks created from templates
  status: z.enum([
    'draft',              // مسودة
    'new',               // جديدة
    'in-progress',       // قيد التنفيذ
    'pending-approval',  // في انتظار الموافقة
    'approved',         // تمت الموافقة
    'completed',        // مكتملة
    'rejected',         // مرفوضة
    'cancelled'         // ملغاة
  ], {
    errorMap: () => ({ message: 'حالة المهمة غير صالحة' })
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'أولوية المهمة يجب أن تكون منخفضة، متوسطة، أو عالية' })
  }),
  assignerId: z.number({
    required_error: 'معرف المسند مطلوب',
    invalid_type_error: 'معرف المسند يجب أن يكون رقماً'
  }),
  assigneeId: z.number({
    required_error: 'معرف المسند إليه مطلوب',
    invalid_type_error: 'معرف المسند إليه يجب أن يكون رقماً'
  }),
  createdAt: z.string({
    required_error: 'تاريخ الإنشاء مطلوب',
    invalid_type_error: 'تاريخ الإنشاء يجب أن يكون نصاً'
  }),
  dueDate: z.string({
    required_error: 'تاريخ الاستحقاق مطلوب',
    invalid_type_error: 'تاريخ الاستحقاق يجب أن يكون نصاً'
  }).refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'تاريخ الاستحقاق غير صالح' }
  ),
  completedAt: z.string().optional(),
  relatedCaseId: z.string().optional(),
  comments: z.array(commentSchema).optional(),
  approvalWorkflow: z.array(approvalStepSchema).optional(),
  
  // Time tracking
  estimatedHours: z.number({
    required_error: 'الوقت المقدر مطلوب',
    invalid_type_error: 'الوقت المقدر يجب أن يكون رقماً'
  }).min(0.5, 'الوقت المقدر يجب أن يكون 30 دقيقة على الأقل'),
  
  actualHours: z.number().optional(),
  
  timeEntries: z.array(z.object({
    date: z.string(),
    hours: z.number().min(0.25, 'أقل وقت يمكن تسجيله هو 15 دقيقة'),
    description: z.string(),
    billable: z.boolean().default(true)
  })).optional(),

  // Progress tracking
  progress: z.number().min(0).max(100).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    dueDate: z.string(),
    status: z.enum(['pending', 'completed', 'overdue']),
    completedAt: z.string().optional()
  })).optional(),

  // Dependencies
  dependencies: z.array(z.object({
    taskId: z.string(),
    type: z.enum(['blocks', 'blocked-by', 'related-to']),
    notes: z.string().optional()
  })).optional(),

  // Workflow specific fields
  workflow: z.object({
    currentStep: z.number().min(1),
    totalSteps: z.number().min(1),
    sequence: z.array(z.object({
      step: z.number().min(1),
      name: z.string(),
      type: z.enum(['review', 'approval', 'notification']),
      assigneeId: z.number(),
      status: z.enum(['pending', 'completed', 'skipped']),
      completedAt: z.string().optional(),
      notes: z.string().optional()
    })),
    autoAdvance: z.boolean().default(true),
    allowSkip: z.boolean().default(false),
    requireAllApprovals: z.boolean().default(true)
  }).optional(),

  // Court related fields
  courtInfo: z.object({
    caseNumber: z.string().optional(),
    courtName: z.string().optional(),
    hearingDate: z.string().optional(),
    deadline: z.string().optional(),
    requiredDocuments: z.array(z.string()).optional()
  }).optional(),

  // Billing information
  billing: z.object({
    billable: z.boolean().default(true),
    rateType: z.enum(['hourly', 'fixed', 'non-billable']),
    rate: z.number().optional(),
    currency: z.enum(['USD', 'AED', 'SAR']).optional(),
    invoiceId: z.string().optional()
  }).optional(),

  // Recurrence settings
  recurrence: z.object({
    enabled: z.boolean().default(false),
    pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
    interval: z.number().optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
    endDate: z.string().optional(),
    occurrences: z.number().optional()
  }).optional(),

  // Reminder settings
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification', 'sms']),
    beforeDue: z.number(), // minutes before due date
    recipients: z.array(z.number()), // array of employee IDs
    message: z.string().optional()
  })).optional(),

  // Audit trail
  auditTrail: z.array(z.object({
    action: z.enum([
      'created',
      'updated',
      'status-changed',
      'assigned',
      'comment-added',
      'file-attached',
      'reminder-sent',
      'workflow-advanced'
    ]),
    timestamp: z.string(),
    userId: z.number(),
    details: z.record(z.any()).optional()
  })).optional()
});

export const taskUpdateSchema = taskSchema.partial().omit({ createdAt: true });

export type CreateTaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof taskUpdateSchema>;