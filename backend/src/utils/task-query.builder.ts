import { z } from 'zod';

// Query parameter validation schema
export const taskQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  sortBy: z.enum(['dueDate', 'createdAt', 'priority', 'status', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  assigneeId: z.string().optional(),
  assignerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  relatedCaseId: z.string().optional()
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

export interface TaskFilter {
  $and?: any[];
  $or?: any[];
  [key: string]: any;
}

export class TaskQueryBuilder {
  private filter: TaskFilter = {};
  private searchFields = ['title', 'description'];

  constructor(private params: TaskQueryParams) {}

  /**
   * Build the complete MongoDB query filter
   */
  build(): TaskFilter {
    this.addBasicFilters()
        .addDateRangeFilter()
        .addSearchFilter();

    return this.filter;
  }

  /**
   * Add basic field filters
   */
  private addBasicFilters(): this {
    const { status, priority, category, type, assigneeId, assignerId, relatedCaseId } = this.params;

    // Add exact match filters
    if (status) this.filter.status = status;
    if (priority) this.filter.priority = priority;
    if (category) this.filter.category = category;
    if (type) this.filter.type = type;
    if (relatedCaseId) this.filter.relatedCaseId = relatedCaseId;

    // Add numeric filters
    if (assigneeId) this.filter.assigneeId = parseInt(assigneeId);
    if (assignerId) this.filter.assignerId = parseInt(assignerId);

    return this;
  }

  /**
   * Add date range filter for dueDate or createdAt
   */
  private addDateRangeFilter(): this {
    const { dateFrom, dateTo } = this.params;
    
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      
      if (dateFrom) {
        dateFilter.$gte = new Date(dateFrom).toISOString();
      }
      
      if (dateTo) {
        dateFilter.$lte = new Date(dateTo).toISOString();
      }

      // Add to existing $and array or create new one
      const dateCondition = { dueDate: dateFilter };
      if (this.filter.$and) {
        this.filter.$and.push(dateCondition);
      } else {
        this.filter.$and = [dateCondition];
      }
    }

    return this;
  }

  /**
   * Add full-text search filter
   */
  private addSearchFilter(): this {
    const { search } = this.params;
    
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = this.searchFields.map(field => ({
        [field]: searchRegex
      }));

      // Add to existing $or array or create new one
      if (this.filter.$or) {
        this.filter.$or.push(...searchConditions);
      } else {
        this.filter.$or = searchConditions;
      }
    }

    return this;
  }

  /**
   * Get sort options for MongoDB query
   */
  getSortOptions(): { [key: string]: 1 | -1 } {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = this.params;
    return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  }

  /**
   * Get pagination options
   */
  getPaginationOptions(): { skip: number; limit: number } {
    const page = Math.max(1, this.params.page || 1);
    const limit = Math.max(1, Math.min(this.params.limit || 20, 100)); // Max 100 items per page
    return {
      skip: (page - 1) * limit,
      limit
    };
  }
}