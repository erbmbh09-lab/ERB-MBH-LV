// Common interfaces shared between frontend and backend
export interface BaseResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface Permission {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve';
}

export interface PermissionGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  permissions: Permission[];
}

export interface PermissionCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  groups: PermissionGroup[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: number;
  userType: 'Employee' | 'Client';
  action: string;
  module: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntry {
  action: string;
  timestamp: string;
  userId: number;
  details?: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}