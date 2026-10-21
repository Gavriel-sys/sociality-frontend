import { QueryClient } from "@tanstack/react-query";
import { ApiAbortError, ApiHttpError } from "@/lib/api/api-errors";

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);
const MAX_QUERY_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 60 * 1000;
const DEFAULT_GC_TIME_MS = 5 * 60 * 1000;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  if (error instanceof ApiAbortError) {
    return false;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }
  if (error instanceof ApiHttpError && NON_RETRYABLE_STATUSES.has(error.status)) {
    return false;
  }
  return true;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (browserQueryClient === undefined) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function resetBrowserQueryClientForTesting(): void {
  browserQueryClient = undefined;
}
