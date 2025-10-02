"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueryBuilder = exports.taskQuerySchema = void 0;
const zod_1 = require("zod");
// Query parameter validation schema
exports.taskQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => parseInt(val || '1')),
    limit: zod_1.z.string().optional().transform(val => parseInt(val || '20')),
    sortBy: zod_1.z.enum(['dueDate', 'createdAt', 'priority', 'status', 'title']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    status: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().optional(),
    assignerId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    relatedCaseId: zod_1.z.string().optional()
});
class TaskQueryBuilder {
    params;
    filter = {};
    searchFields = ['title', 'description'];
    constructor(params) {
        this.params = params;
    }
    /**
     * Build the complete MongoDB query filter
     */
    build() {
        this.addBasicFilters()
            .addDateRangeFilter()
            .addSearchFilter();
        return this.filter;
    }
    /**
     * Add basic field filters
     */
    addBasicFilters() {
        const { status, priority, category, type, assigneeId, assignerId, relatedCaseId } = this.params;
        // Add exact match filters
        if (status)
            this.filter.status = status;
        if (priority)
            this.filter.priority = priority;
        if (category)
            this.filter.category = category;
        if (type)
            this.filter.type = type;
        if (relatedCaseId)
            this.filter.relatedCaseId = relatedCaseId;
        // Add numeric filters
        if (assigneeId)
            this.filter.assigneeId = parseInt(assigneeId);
        if (assignerId)
            this.filter.assignerId = parseInt(assignerId);
        return this;
    }
    /**
     * Add date range filter for dueDate or createdAt
     */
    addDateRangeFilter() {
        const { dateFrom, dateTo } = this.params;
        if (dateFrom || dateTo) {
            const dateFilter = {};
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
            }
            else {
                this.filter.$and = [dateCondition];
            }
        }
        return this;
    }
    /**
     * Add full-text search filter
     */
    addSearchFilter() {
        const { search } = this.params;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            const searchConditions = this.searchFields.map(field => ({
                [field]: searchRegex
            }));
            // Add to existing $or array or create new one
            if (this.filter.$or) {
                this.filter.$or.push(...searchConditions);
            }
            else {
                this.filter.$or = searchConditions;
            }
        }
        return this;
    }
    /**
     * Get sort options for MongoDB query
     */
    getSortOptions() {
        const { sortBy = 'createdAt', sortOrder = 'desc' } = this.params;
        return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    }
    /**
     * Get pagination options
     */
    getPaginationOptions() {
        const page = Math.max(1, this.params.page || 1);
        const limit = Math.max(1, Math.min(this.params.limit || 20, 100)); // Max 100 items per page
        return {
            skip: (page - 1) * limit,
            limit
        };
    }
}
exports.TaskQueryBuilder = TaskQueryBuilder;
//# sourceMappingURL=task-query.builder.js.map