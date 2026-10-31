const DEFAULT_API_BASE_URL = "https://be-social-media-api-production.up.railway.app";

export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigError";
  }
}

function parseUrlCandidate(rawUrl: string | undefined): URL {
  if (rawUrl === undefined || rawUrl.trim().length === 0) {
    throw new ApiConfigError("API base URL is required but was not provided.");
  }
  try {
    return new URL(rawUrl);
  } catch {
    throw new ApiConfigError("API base URL is not a well-formed URL.");
  }
}

function assertValidProtocol(parsed: URL): void {
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiConfigError("API base URL must use http or https protocol.");
  }
}

function assertNoCredentials(parsed: URL): void {
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new ApiConfigError("API base URL must not contain user credentials.");
  }
}

function assertNoQueryOrFragment(parsed: URL): void {
  if (parsed.search.length > 0) {
    throw new ApiConfigError("API base URL must not contain a query string.");
  }
  if (parsed.hash.length > 0) {
    throw new ApiConfigError("API base URL must not contain a hash fragment.");
  }
}

function assertRootPathOnly(parsed: URL): void {
  if (parsed.pathname !== "" && parsed.pathname !== "/") {
    throw new ApiConfigError("API base URL must be a root origin with no path.");
  }
}

export function validateApiBaseUrl(rawUrl: string | undefined): string {
  const parsed = parseUrlCandidate(rawUrl);
  assertValidProtocol(parsed);
  assertNoCredentials(parsed);
  assertNoQueryOrFragment(parsed);
  assertRootPathOnly(parsed);
  return parsed.origin;
}

export function getApiBaseUrl(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return validateApiBaseUrl(configuredOrigin || DEFAULT_API_BASE_URL);
}

function assertValidEndpointPath(endpoint: string): void {
  if (typeof endpoint !== "string" || endpoint.trim().length === 0) {
    throw new ApiConfigError("Endpoint must be a non-empty string.");
  }
  if (!endpoint.startsWith("/api/") && endpoint !== "/api") {
    throw new ApiConfigError("Endpoint must start with root-relative /api path.");
  }
  if (endpoint.includes("//") || endpoint.includes("\\") || endpoint.includes("/../") || endpoint.endsWith("/..")) {
    throw new ApiConfigError("Endpoint contains invalid path traversal or escape sequences.");
  }
}

export function buildApiUrl(endpoint: string, baseOrigin?: string): string {
  assertValidEndpointPath(endpoint);
  const apiOrigin = baseOrigin !== undefined ? validateApiBaseUrl(baseOrigin) : getApiBaseUrl();
  return `${apiOrigin}${endpoint}`;
}
