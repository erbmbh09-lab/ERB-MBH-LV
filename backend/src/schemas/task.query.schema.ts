import { z } from 'zod';

// Schema for task search and filter parameters
export const taskQuerySchema = z.object({
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),

  // Sorting
  sortBy: z.enum([
    'dueDate',
    'createdAt',
    'priority',
    'status',
    'title',
    'progress'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Filters
  status: z.enum([
    'draft',
    'new',
    'in-progress',
    'pending-approval',
    'approved',
    'completed',
    'rejected',
    'cancelled'
  ]).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum([
    'legal-research',
    'document-review',
    'court-preparation',
    'client-communication',
    'administrative',
    'financial',
    'other'
  ]).optional(),
  type: z.enum(['personal', 'assigned']).optional(),

  // Date Range
  dateFrom: z.string()
    .refine(date => !isNaN(Date.parse(date)), { 
      message: 'تاريخ البداية غير صالح' 
    }).optional(),
  dateTo: z.string()
    .refine(date => !isNaN(Date.parse(date)), { 
      message: 'تاريخ النهاية غير صالح' 
    }).optional(),

  // Search
  search: z.string().optional(),
  searchFields: z.array(
    z.enum(['title', 'description', 'comments'])
  ).optional(),

  // Assignment Filters
  assigneeId: z.number().optional(),
  assignerId: z.number().optional(),
  myTasks: z.boolean().optional(), // Filter for current user's tasks

  // Related Items
  relatedCaseId: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  hasDependencies: z.boolean().optional(),

  // Progress
  progressMin: z.number().min(0).max(100).optional(),
  progressMax: z.number().min(0).max(100).optional(),

  // Time Range
  dueSoon: z.number().optional(), // Days until due
  overdue: z.boolean().optional(),
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

// Schema for bulk operations
export const taskBulkOperationSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'يجب تحديد مهمة واحدة على الأقل'),
  operation: z.enum([
    'update-status',
    'update-priority',
    'reassign',
    'delete'
  ]),
  value: z.any(), // Value depends on operation type
  notes: z.string().optional()
});