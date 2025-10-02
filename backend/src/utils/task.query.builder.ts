import { TaskQueryParams } from '../schemas/task.query.schema';
import { logger } from '../utils/logger';

export class TaskQueryBuilder {
  private filter: any = {};
  private sortOptions: any = {};
  private paginationOptions: { skip: number; limit: number };

  constructor(private params: TaskQueryParams, private userId?: number) {
    this.paginationOptions = {
      skip: (params.page - 1) * params.limit,
      limit: params.limit
    };
    this.sortOptions = {
      [params.sortBy]: params.sortOrder === 'desc' ? -1 : 1
    };
  }

  /**
   * Build complete MongoDB query with all filters
   */
  build() {
    this.addBasicFilters()
        .addDateFilters()
        .addSearchFilter()
        .addProgressFilter()
        .addRelatedItemsFilter()
        .addUserFilter();

    return {
      filter: this.filter,
      sort: this.sortOptions,
      skip: this.paginationOptions.skip,
      limit: this.paginationOptions.limit
    };
  }

  /**
   * Add basic field filters
   */
  private addBasicFilters() {
    const { status, priority, category, type } = this.params;

    if (status) this.filter.status = status;
    if (priority) this.filter.priority = priority;
    if (category) this.filter.category = category;
    if (type) this.filter.type = type;

    return this;
  }

  /**
   * Add date-based filters
   */
  private addDateFilters() {
    const { dateFrom, dateTo, dueSoon, overdue } = this.params;
    const dateFilter: any = {};

    // Date range filter
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      this.filter.dueDate = dateFilter;
    }

    // Due soon filter
    if (dueSoon) {
      const dueSoonDate = new Date();
      dueSoonDate.setDate(dueSoonDate.getDate() + dueSoon);
      this.filter.dueDate = {
        $lte: dueSoonDate,
        $gt: new Date()
      };
    }

    // Overdue filter
    if (overdue) {
      this.filter.dueDate = {
        $lt: new Date()
      };
      this.filter.status = {
        $nin: ['completed', 'cancelled']
      };
    }

    return this;
  }

  /**
   * Add full-text search filter
   */
  private addSearchFilter() {
    const { search, searchFields = ['title', 'description'] } = this.params;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = searchFields.map(field => ({
        [field]: searchRegex
      }));

      if (searchFields.includes('comments')) {
        searchConditions.push({
          'comments.content': searchRegex
        });
      }

      this.filter.$or = searchConditions;
    }

    return this;
  }

  /**
   * Add progress-based filters
   */
  private addProgressFilter() {
    const { progressMin, progressMax } = this.params;
    const progressFilter: any = {};

    if (progressMin !== undefined) progressFilter.$gte = progressMin;
    if (progressMax !== undefined) progressFilter.$lte = progressMax;

    if (Object.keys(progressFilter).length > 0) {
      this.filter.progress = progressFilter;
    }

    return this;
  }

  /**
   * Add filters for related items
   */
  private addRelatedItemsFilter() {
    const { relatedCaseId, hasAttachments, hasDependencies } = this.params;

    if (relatedCaseId) this.filter.relatedCaseId = relatedCaseId;
    if (hasAttachments) {
      this.filter['comments.attachments'] = { $exists: true, $ne: [] };
    }
    if (hasDependencies) {
      this.filter.dependencies = { $exists: true, $ne: [] };
    }

    return this;
  }

  /**
   * Add user-specific filters
   */
  private addUserFilter() {
    const { myTasks, assigneeId, assignerId } = this.params;

    if (myTasks && this.userId) {
      this.filter.$or = [
        { assigneeId: this.userId },
        { assignerId: this.userId }
      ];
    } else {
      if (assigneeId) this.filter.assigneeId = assigneeId;
      if (assignerId) this.filter.assignerId = assignerId;
    }

    return this;
  }

  /**
   * Add text search aggregation stage
   */
  getSearchStage() {
    const { search } = this.params;
    if (!search) return null;

    return {
      $search: {
        index: 'tasks',
        text: {
          query: search,
          path: ['title', 'description', 'comments.content'],
          fuzzy: {
            maxEdits: 1
          }
        }
      }
    };
  }
}