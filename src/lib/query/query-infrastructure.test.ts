import { beforeEach, describe, expect, it } from "vitest";
import { ApiAbortError, ApiHttpError, ApiNetworkError } from "@/lib/api/api-errors";
import {
  getQueryClient,
  makeQueryClient,
  resetBrowserQueryClientForTesting,
  shouldRetryQuery,
} from "./query-client";
import { queryKeys } from "./query-keys";
import {
  buildNormalizedQueryString,
  normalizePaginationParams,
  normalizePositiveInteger,
  normalizeSearchParams,
  normalizeSearchQuery,
  QueryParamError,
} from "./query-params";

describe("query-params normalization", () => {
  it("normalizes positive integers and string representations to numbers", () => {
    // Arrange & Act
    const fromNum = normalizePositiveInteger("page", 2);
    const fromStr = normalizePositiveInteger("page", "2");
    const fromPadded = normalizePositiveInteger("page", "02");

    // Assert
    expect(fromNum).toBe(2);
    expect(fromStr).toBe(2);
    expect(fromPadded).toBe(2);
  });

  it("distinguishes omitted undefined from invalid input", () => {
    // Arrange & Act
    const omitted = normalizePositiveInteger("limit", undefined);

    // Assert
    expect(omitted).toBeUndefined();
  });

  it("rejects zero explicitly where positive integer is required", () => {
    // Arrange & Act & Assert
    expect(() => normalizePositiveInteger("page", 0)).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", "0")).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("limit", "00")).toThrow(QueryParamError);
  });

  it("rejects negative, fractional, and non-numeric inputs", () => {
    // Arrange & Act & Assert
    expect(() => normalizePositiveInteger("page", -1)).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", 1.5)).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", "1.5")).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", "abc")).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", NaN)).toThrow(QueryParamError);
    expect(() => normalizePositiveInteger("page", Infinity)).toThrow(QueryParamError);
  });

  it("normalizes pagination params properly", () => {
    // Arrange & Act
    const result = normalizePaginationParams({ page: "3", limit: 20 });

    // Assert
    expect(result).toEqual({ page: 3, limit: 20 });
  });

  it("normalizes and trims search query without altering case", () => {
    // Arrange & Act
    const query = normalizeSearchQuery("  JohnDoe  ");

    // Assert
    expect(query).toBe("JohnDoe");
  });

  it("rejects empty or whitespace-only search query", () => {
    // Arrange & Act & Assert
    expect(() => normalizeSearchQuery("")).toThrow(QueryParamError);
    expect(() => normalizeSearchQuery("   ")).toThrow(QueryParamError);
  });

  it("produces identical query keys and request URL parameters for equivalent inputs", () => {
    // Arrange
    const rawA = { page: "1", limit: "10", query: "  dev  " };
    const rawB = { page: 1, limit: 10, query: "dev" };

    // Act
    const normalizedA = normalizeSearchParams(rawA);
    const normalizedB = normalizeSearchParams(rawB);

    const keyA = queryKeys.public.search(normalizedA);
    const keyB = queryKeys.public.search(normalizedB);

    const queryStringA = buildNormalizedQueryString(normalizedA);
    const queryStringB = buildNormalizedQueryString(normalizedB);

    // Assert
    expect(normalizedA).toEqual(normalizedB);
    expect(keyA).toEqual(keyB);
    expect(queryStringA).toBe(queryStringB);
    expect(queryStringA).toBe("?limit=10&page=1&query=dev");
  });
});

describe("query-keys isolation and namespaces", () => {
  it("provides distinct public namespaces", () => {
    // Arrange & Act
    const searchKey = queryKeys.public.search({ page: 1 });
    const userKey = queryKeys.public.userProfile("alice");

    // Assert
    expect(searchKey[0]).toBe("public");
    expect(userKey[0]).toBe("public");
  });

  it("creates private namespace keyed by explicit non-secret session identity", () => {
    // Arrange & Act
    const privateKeys = queryKeys.private("user_session_456");

    // Assert
    expect(privateKeys.all).toEqual(["private", "user_session_456"]);
    expect(privateKeys.me()).toEqual(["private", "user_session_456", "me"]);
    expect(privateKeys.feed({ page: 1 })).toEqual([
      "private",
      "user_session_456",
      "feed",
      { page: 1 },
    ]);
  });

  it("rejects empty or whitespace session identity", () => {
    // Arrange & Act & Assert
    expect(() => queryKeys.private("")).toThrow("session identity");
    expect(() => queryKeys.private("   ")).toThrow("session identity");
  });

  it("rejects token strings from being placed in query keys", () => {
    // Arrange & Act & Assert
    expect(() => queryKeys.private("Bearer eyJhbGciOi...")).toThrow("Tokens must not be used");
    expect(() => queryKeys.private("my_secret_token_123")).toThrow("Tokens must not be used");
  });
});

describe("QueryClient infrastructure", () => {
  beforeEach(() => {
    resetBrowserQueryClientForTesting();
  });

  it("creates independent QueryClient instances that do not leak state", () => {
    // Arrange
    const client1 = makeQueryClient();
    const client2 = makeQueryClient();

    // Act
    client1.setQueryData(["test"], "value-1");

    // Assert
    expect(client1.getQueryData(["test"])).toBe("value-1");
    expect(client2.getQueryData(["test"])).toBeUndefined();
  });

  it("has default query and mutation options configured correctly", () => {
    // Arrange
    const client = makeQueryClient();
    const defaultQueries = client.getDefaultOptions().queries;
    const defaultMutations = client.getDefaultOptions().mutations;

    // Assert
    expect(defaultQueries?.staleTime).toBe(60 * 1000);
    expect(defaultQueries?.gcTime).toBe(5 * 60 * 1000);
    expect(defaultMutations?.retry).toBe(false);
  });

  it("bounds retries and prevents retrying aborts and non-retryable HTTP errors", () => {
    // Abort cases
    expect(shouldRetryQuery(0, new ApiAbortError())).toBe(false);
    const standardAbort = new Error("aborted");
    standardAbort.name = "AbortError";
    expect(shouldRetryQuery(0, standardAbort)).toBe(false);

    // Non-retryable HTTP errors (400, 401, 403, 404, 422)
    expect(shouldRetryQuery(0, new ApiHttpError(400, "Bad Request"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiHttpError(401, "Unauthorized"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiHttpError(403, "Forbidden"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiHttpError(404, "Not Found"))).toBe(false);
    expect(shouldRetryQuery(0, new ApiHttpError(422, "Unprocessable"))).toBe(false);

    // Max retries exceeded
    expect(shouldRetryQuery(2, new ApiNetworkError())).toBe(false);

    // Retryable cases
    expect(shouldRetryQuery(0, new ApiNetworkError())).toBe(true);
    expect(shouldRetryQuery(1, new ApiHttpError(500, "Server Error"))).toBe(true);
  });

  it("returns stable client in browser environment across calls", () => {
    // Arrange & Act
    const clientA = getQueryClient();
    const clientB = getQueryClient();

    // Assert
    expect(clientA).toBe(clientB);
  });
});
