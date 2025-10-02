export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export function buildMongoQuery(params: QueryParams): any {
  const query: any = {};

  // Remove pagination and sorting params
  const { page, limit, sortBy, sortOrder, search, ...filters } = params;

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        query[key] = { $in: value };
      } else if (typeof value === 'string' && value.includes(',')) {
        query[key] = { $in: value.split(',') };
      } else {
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

export function buildSortOptions(params: QueryParams): any {
  const { sortBy, sortOrder = 'desc' } = params;
  if (!sortBy) return { createdAt: -1 }; // default sort

  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  return sort;
}

export async function paginateResults<T>(
  model: any,
  query: any,
  options: {
    page?: number;
    limit?: number;
    sort?: any;
    populate?: string | string[];
  }
): Promise<PaginationResult<T>> {
  const { page = 1, limit = 20, sort, populate } = options;
  const skip = (Number(page) - 1) * Number(limit);

  let queryBuilder = model.find(query);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(field => {
        queryBuilder = queryBuilder.populate(field);
      });
    } else {
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