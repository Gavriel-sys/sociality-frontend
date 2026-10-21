export class QueryParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryParamError";
  }
}

export interface PaginationParams {
  readonly page?: number | string;
  readonly limit?: number | string;
}

export type NormalizedPaginationParams = {
  readonly page?: number;
  readonly limit?: number;
};

export interface SearchParams extends PaginationParams {
  readonly query?: string;
}

export type NormalizedSearchParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly query?: string;
};

function parseIntegerCandidate(value: number | string): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new QueryParamError("Parameter must be a finite integer.");
    }
    return value;
  }
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new QueryParamError("Parameter must be an integer string containing only digits.");
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    throw new QueryParamError("Parameter value exceeds safe integer range.");
  }
  return parsed;
}

export function normalizePositiveInteger(
  paramName: string,
  value: number | string | undefined,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = parseIntegerCandidate(value);
  if (parsed <= 0) {
    throw new QueryParamError(`${paramName} must be a positive integer greater than zero.`);
  }
  return parsed;
}

export function normalizeSearchQuery(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new QueryParamError("Search query must be a string.");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new QueryParamError("Search query must not be empty or whitespace.");
  }
  return trimmed;
}

export function normalizePaginationParams(
  params: PaginationParams | undefined,
): NormalizedPaginationParams {
  if (params === undefined) {
    return {};
  }
  const page = normalizePositiveInteger("page", params.page);
  const limit = normalizePositiveInteger("limit", params.limit);
  return {
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };
}

export function normalizeSearchParams(
  params: SearchParams | undefined,
): NormalizedSearchParams {
  if (params === undefined) {
    return {};
  }
  const pagination = normalizePaginationParams(params);
  const query = normalizeSearchQuery(params.query);
  return {
    ...pagination,
    ...(query !== undefined ? { query } : {}),
  };
}

export function buildNormalizedQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}
