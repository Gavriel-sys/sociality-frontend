import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ApiConfigError,
  buildApiUrl,
  getApiBaseUrl,
  validateApiBaseUrl,
} from "./api-config";

describe("validateApiBaseUrl", () => {
  it("accepts a valid https root origin without trailing slash", () => {
    // Arrange & Act
    const result = validateApiBaseUrl("https://be-social-media-api-production.up.railway.app");

    // Assert
    expect(result).toBe("https://be-social-media-api-production.up.railway.app");
  });

  it("accepts a valid https root origin with trailing slash and normalizes it", () => {
    // Arrange & Act
    const result = validateApiBaseUrl("https://example.com/");

    // Assert
    expect(result).toBe("https://example.com");
  });

  it("accepts localhost with port over http", () => {
    // Arrange & Act
    const result = validateApiBaseUrl("http://localhost:3000");

    // Assert
    expect(result).toBe("http://localhost:3000");
  });

  it("accepts loopback 127.0.0.1 with port over http", () => {
    // Arrange & Act
    const result = validateApiBaseUrl("http://127.0.0.1:8080");

    // Assert
    expect(result).toBe("http://127.0.0.1:8080");
  });

  it("rejects undefined or empty string", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl(undefined)).toThrow(ApiConfigError);
    expect(() => validateApiBaseUrl("")).toThrow(ApiConfigError);
    expect(() => validateApiBaseUrl("   ")).toThrow(ApiConfigError);
  });

  it("rejects malformed URLs without echoing input", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("not-a-valid-url")).toThrow(
      "API base URL is not a well-formed URL.",
    );
  });

  it("rejects unsupported protocols", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("ftp://example.com")).toThrow(
      "API base URL must use http or https protocol.",
    );
    expect(() => validateApiBaseUrl("ws://example.com")).toThrow(
      "API base URL must use http or https protocol.",
    );
  });

  it("rejects URLs with embedded credentials", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("https://admin:secret@example.com")).toThrow(
      "API base URL must not contain user credentials.",
    );
  });

  it("rejects URLs with query strings", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("https://example.com?foo=bar")).toThrow(
      "API base URL must not contain a query string.",
    );
  });

  it("rejects URLs with hash fragments", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("https://example.com#section")).toThrow(
      "API base URL must not contain a hash fragment.",
    );
  });

  it("rejects non-root paths including /api without echoing input", () => {
    // Arrange & Act & Assert
    expect(() => validateApiBaseUrl("https://example.com/api")).toThrow(
      "API base URL must be a root origin with no path.",
    );
    expect(() => validateApiBaseUrl("https://example.com/v1/")).toThrow(
      "API base URL must be a root origin with no path.",
    );
  });

  it("does not include sensitive input text in error messages", () => {
    // Arrange
    const sensitive = "https://sensitive-secret-token@example.com/path?key=123";

    // Act & Assert
    try {
      validateApiBaseUrl(sensitive);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiConfigError);
      expect((error as Error).message).not.toContain("sensitive-secret-token");
      expect((error as Error).message).not.toContain("key=123");
    }
  });
});

describe("getApiBaseUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
  });

  it("reads and validates NEXT_PUBLIC_API_BASE_URL from environment", () => {
    // Arrange & Act
    const result = getApiBaseUrl();

    // Assert
    expect(result).toBe("https://example.com");
  });

  it("throws when environment variable is unset", () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    // Act & Assert
    expect(() => getApiBaseUrl()).toThrow(ApiConfigError);
  });
});

describe("buildApiUrl", () => {
  const validOrigin = "https://example.com";

  it("joins origin and approved /api endpoint cleanly", () => {
    // Arrange & Act
    const url = buildApiUrl("/api/users", validOrigin);

    // Assert
    expect(url).toBe("https://example.com/api/users");
  });

  it("rejects endpoints not starting with /api", () => {
    // Arrange & Act & Assert
    expect(() => buildApiUrl("/v1/users", validOrigin)).toThrow(
      "Endpoint must start with root-relative /api path.",
    );
  });

  it("rejects protocol-relative and scheme escapes", () => {
    // Arrange & Act & Assert
    expect(() => buildApiUrl("//evil.com/api/users", validOrigin)).toThrow(
      "Endpoint must start with root-relative /api path.",
    );
  });

  it("rejects path traversal in endpoints", () => {
    // Arrange & Act & Assert
    expect(() => buildApiUrl("/api/../escape", validOrigin)).toThrow(
      "Endpoint contains invalid path traversal or escape sequences.",
    );
    expect(() => buildApiUrl("/api/test/..", validOrigin)).toThrow(
      "Endpoint contains invalid path traversal or escape sequences.",
    );
    expect(() => buildApiUrl("/api/test\\escape", validOrigin)).toThrow(
      "Endpoint contains invalid path traversal or escape sequences.",
    );
  });

  it("rejects empty or whitespace-only endpoints", () => {
    // Arrange & Act & Assert
    expect(() => buildApiUrl("", validOrigin)).toThrow(ApiConfigError);
    expect(() => buildApiUrl("   ", validOrigin)).toThrow(ApiConfigError);
  });
});
