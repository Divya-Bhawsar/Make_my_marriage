// Make My Marriage — Standard API Contract Types

import { UserRole } from '../constants';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  total?: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  pagination?: PaginationMeta | CursorPaginationMeta;
}

export interface ApiActionResponse {
  success: boolean;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface TenantContext {
  userId: string;
  membershipId: string;
  weddingId: string;
  role: UserRole;
}
