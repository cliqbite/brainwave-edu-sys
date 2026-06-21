import type { PaginationMeta, PaginationQuery } from '@brainwave/shared';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ParsedPagination {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Extracts and normalises pagination params from Express query object.
 * Returns sensible defaults for missing/invalid values.
 */
export function parsePaginationQuery(
  query: Record<string, unknown>,
  defaults?: { sortBy?: string; sortOrder?: 'asc' | 'desc' },
): ParsedPagination {
  const rawPage = Number(query['page']);
  const rawLimit = Number(query['limit']);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const search = typeof query['search'] === 'string' ? query['search'].trim() : '';
  const sortBy = typeof query['sortBy'] === 'string' ? query['sortBy'] : (defaults?.sortBy ?? 'createdAt');
  const sortOrder =
    query['sortOrder'] === 'asc' || query['sortOrder'] === 'desc'
      ? query['sortOrder']
      : (defaults?.sortOrder ?? 'desc');

  return { page, limit, search, sortBy, sortOrder };
}

export function buildPaginationMeta(
  total: number,
  page: number | undefined,
  limit: number | undefined,
): PaginationMeta {
  const p = page ?? DEFAULT_PAGE;
  const l = limit ?? DEFAULT_LIMIT;
  const totalPages = Math.ceil(total / l) || 1;
  return {
    page: p,
    limit: l,
    total,
    totalPages,
    hasNext: p < totalPages,
    hasPrev: p > 1,
  };
}

export function buildPrismaQueryArgs(pagination: Partial<ParsedPagination>): {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
} {
  const p = pagination.page ?? DEFAULT_PAGE;
  const l = pagination.limit ?? DEFAULT_LIMIT;
  const sb = pagination.sortBy ?? 'createdAt';
  const so = pagination.sortOrder ?? 'desc';
  return {
    skip: (p - 1) * l,
    take: l,
    orderBy: { [sb]: so },
  };
}
