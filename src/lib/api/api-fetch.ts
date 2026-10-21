import { buildApiUrl } from "@/lib/config/api-config";
import {
  ApiAbortError,
  ApiDecodeError,
  ApiHttpError,
  ApiNetworkError,
} from "./api-errors";

export interface ApiFetchOptions<T = unknown> {
  readonly endpoint: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly token?: string;
  readonly signal?: AbortSignal;
  readonly baseUrl?: string;
  readonly fetchFn?: typeof fetch;
  readonly decoder?: (raw: unknown) => T;
}

function resolveFetch(customFetch?: typeof fetch): typeof fetch {
  return customFetch !== undefined ? customFetch : globalThis.fetch;
}

function serializeBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }
  return typeof body === "string" ? body : JSON.stringify(body);
}

interface RequestHeadersConfig {
  readonly customHeaders?: Record<string, string>;
  readonly hasBody: boolean;
  readonly token?: string;
}

function createRequestHeaders(config: RequestHeadersConfig): Headers {
  const headers = new Headers(config.customHeaders);
  if (config.hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (
    config.token !== undefined &&
    config.token.trim().length > 0 &&
    !headers.has("Authorization")
  ) {
    headers.set("Authorization", `Bearer ${config.token.trim()}`);
  }
  return headers;
}

async function extractResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    if (!response.ok) {
      return text;
    }
    throw new ApiDecodeError("API response contains invalid JSON syntax.", error);
  }
}

function handleFetchRejection(error: unknown, signal?: AbortSignal): never {
  if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
    throw new ApiAbortError("The fetch request was aborted.", error);
  }
  throw new ApiNetworkError("The fetch request failed due to a network error.", error);
}

function applyDecoder<T>(data: unknown, decoder?: (raw: unknown) => T): T {
  if (decoder === undefined) {
    return data as T;
  }
  try {
    return decoder(data);
  } catch (error) {
    throw new ApiDecodeError("Response data failed schema/decoder validation.", error);
  }
}

export async function apiFetch<T = unknown>(options: ApiFetchOptions<T>): Promise<T> {
  const targetUrl = buildApiUrl(options.endpoint, options.baseUrl);
  const fetchClient = resolveFetch(options.fetchFn);
  const serialized = serializeBody(options.body);
  const headers = createRequestHeaders({
    customHeaders: options.headers,
    hasBody: serialized !== undefined,
    token: options.token,
  });

  let response: Response;
  try {
    response = await fetchClient(targetUrl, {
      method: options.method !== undefined ? options.method : "GET",
      headers,
      body: serialized,
      signal: options.signal,
    });
  } catch (error) {
    handleFetchRejection(error, options.signal);
  }

  const parsedBody = await extractResponseBody(response);
  if (!response.ok) {
    throw new ApiHttpError(response.status, response.statusText, parsedBody);
  }
  return applyDecoder(parsedBody, options.decoder);
}
