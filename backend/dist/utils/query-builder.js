"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMongoQuery = buildMongoQuery;
exports.buildSortOptions = buildSortOptions;
exports.paginateResults = paginateResults;
function buildMongoQuery(params) {
    const query = {};
    // Remove pagination and sorting params
    const { page, limit, sortBy, sortOrder, search, ...filters } = params;
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                query[key] = { $in: value };
            }
            else if (typeof value === 'string' && value.includes(',')) {
                query[key] = { $in: value.split(',') };
            }
            else {
                query[key] = value;
            }
        }
    });
    // Add search if provided
    if (search) {
        // Note: searchFields should be defined by the caller
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = Object.keys(query).map(field => ({ [field]: searchRegex }));
    }
    return query;
}
function buildSortOptions(params) {
    const { sortBy, sortOrder = 'desc' } = params;
    if (!sortBy)
        return { createdAt: -1 }; // default sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    return sort;
}
async function paginateResults(model, query, options) {
    const { page = 1, limit = 20, sort, populate } = options;
    const skip = (Number(page) - 1) * Number(limit);
    let queryBuilder = model.find(query);
    if (populate) {
        if (Array.isArray(populate)) {
            populate.forEach(field => {
                queryBuilder = queryBuilder.populate(field);
            });
        }
        else {
            queryBuilder = queryBuilder.populate(populate);
        }
    }
    const [items, total] = await Promise.all([
        queryBuilder
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .exec(),
        model.countDocuments(query)
    ]);
    return {
        items,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
    };
}
//# sourceMappingURL=query-builder.js.map