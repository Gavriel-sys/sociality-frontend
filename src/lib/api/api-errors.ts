export abstract class ApiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiError";
  }
}

export class ApiNetworkError extends ApiError {
  constructor(message = "Network request failed", cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ApiNetworkError";
  }
}

export class ApiAbortError extends ApiError {
  constructor(message = "The request was aborted", cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ApiAbortError";
  }
}

export class ApiHttpError extends ApiError {
  readonly status: number;
  readonly statusText: string;
  readonly data: unknown;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`HTTP ${status}: ${statusText || "Request failed"}`);
    this.name = "ApiHttpError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export class ApiDecodeError extends ApiError {
  constructor(message = "Failed to decode API response body", cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ApiDecodeError";
  }
}
