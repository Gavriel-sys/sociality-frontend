import { describe, expect, it, vi } from "vitest";
import { ApiConfigError } from "@/lib/config/api-config";
import {
  ApiAbortError,
  ApiDecodeError,
  ApiHttpError,
  ApiNetworkError,
} from "./api-errors";
import { apiFetch } from "./api-fetch";

const testBaseUrl = "https://example.com";

describe("apiFetch", () => {
  it("executes a successful GET request and parses JSON body", async () => {
    // Arrange
    const mockData = { id: 1, title: "Test Post" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    const result = await apiFetch({
      endpoint: "/api/posts",
      baseUrl: testBaseUrl,
      fetchFn: mockFetch,
    });

    // Assert
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/api/posts", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
      signal: undefined,
    });
  });

  it("handles 204 No Content responses safely with undefined", async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        statusText: "No Content",
      }),
    );

    // Act
    const result = await apiFetch({
      endpoint: "/api/posts/1",
      method: "DELETE",
      baseUrl: testBaseUrl,
      fetchFn: mockFetch,
    });

    // Assert
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles empty body 200 responses safely with undefined", async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        statusText: "OK",
      }),
    );

    // Act
    const result = await apiFetch({
      endpoint: "/api/ping",
      baseUrl: testBaseUrl,
      fetchFn: mockFetch,
    });

    // Assert
    expect(result).toBeUndefined();
  });

  it("throws ApiHttpError on non-2xx status code", async () => {
    // Arrange
    const errorBody = { message: "Post not found", code: "NOT_FOUND" };
    const createErrorResponse = () =>
      new Response(JSON.stringify(errorBody), {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" },
      });
    const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(createErrorResponse()));

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/posts/999",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiHttpError);

    try {
      await apiFetch({
        endpoint: "/api/posts/999",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      });
      expect.unreachable();
    } catch (error) {
      const httpError = error as ApiHttpError;
      expect(httpError.status).toBe(404);
      expect(httpError.statusText).toBe("Not Found");
      expect(httpError.data).toEqual(errorBody);
    }
  });

  it("throws ApiDecodeError when 200 response body contains malformed JSON", async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("<html><head><title>Bad Gateway</title></head></html>", {
        status: 200,
        statusText: "OK",
      }),
    );

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/posts",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiDecodeError);
  });

  it("applies a runtime decoder and returns validated data", async () => {
    // Arrange
    const mockData = { id: "user-123", name: "Alice" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const decoder = (raw: unknown): { id: string; name: string } => {
      const candidate = raw as { id?: string; name?: string };
      if (!candidate?.id || !candidate?.name) {
        throw new Error("Missing required fields");
      }
      return { id: candidate.id, name: candidate.name };
    };

    // Act
    const result = await apiFetch({
      endpoint: "/api/me",
      baseUrl: testBaseUrl,
      fetchFn: mockFetch,
      decoder,
    });

    // Assert
    expect(result).toEqual({ id: "user-123", name: "Alice" });
  });

  it("throws ApiDecodeError when runtime decoder rejects payload", async () => {
    // Arrange
    const invalidData = { id: 123 }; // id is number, expected string
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(invalidData), {
        status: 200,
        statusText: "OK",
      }),
    );
    const decoder = (raw: unknown) => {
      const candidate = raw as { id?: unknown };
      if (typeof candidate?.id !== "string") {
        throw new Error("id must be a string");
      }
      return candidate;
    };

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/me",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
        decoder,
      }),
    ).rejects.toThrow(ApiDecodeError);
  });

  it("converts network fetch failure into ApiNetworkError", async () => {
    // Arrange
    const mockFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/posts",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiNetworkError);
  });

  it("converts abort signal cancellation into ApiAbortError", async () => {
    // Arrange
    const abortController = new AbortController();
    abortController.abort();
    const abortError = new Error("The user aborted a request.");
    abortError.name = "AbortError";
    const mockFetch = vi.fn().mockRejectedValue(abortError);

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/posts",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
        signal: abortController.signal,
      }),
    ).rejects.toThrow(ApiAbortError);
  });

  it("does not automatically retry POST mutations on failure", async () => {
    // Arrange
    const mockFetch = vi.fn().mockRejectedValue(new TypeError("Network disconnect"));

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/posts",
        method: "POST",
        body: { content: "Hello" },
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiNetworkError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects non-approved endpoint escape before transport is invoked", async () => {
    // Arrange
    const mockFetch = vi.fn();

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/not-api/test",
        baseUrl: testBaseUrl,
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiConfigError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("attaches Authorization Bearer header when token option is provided", async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    await apiFetch({
      endpoint: "/api/me",
      baseUrl: testBaseUrl,
      token: "secret-jwt-token-123",
      fetchFn: mockFetch,
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const passedHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(passedHeaders.get("Authorization")).toBe("Bearer secret-jwt-token-123");
  });

  it("trims token and ignores empty or whitespace-only token", async () => {
    // Arrange
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    // Act - trimmed
    await apiFetch({
      endpoint: "/api/me",
      baseUrl: testBaseUrl,
      token: "  trimmed-token-xyz  ",
      fetchFn: mockFetch,
    });
    const headersTrimmed = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headersTrimmed.get("Authorization")).toBe("Bearer trimmed-token-xyz");

    // Act - whitespace only
    await apiFetch({
      endpoint: "/api/me",
      baseUrl: testBaseUrl,
      token: "   ",
      fetchFn: mockFetch,
    });
    const headersEmpty = mockFetch.mock.calls[1][1].headers as Headers;
    expect(headersEmpty.has("Authorization")).toBe(false);
  });

  it("does not overwrite existing Authorization header explicitly passed in headers", async () => {
    // Arrange
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    // Act
    await apiFetch({
      endpoint: "/api/me",
      baseUrl: testBaseUrl,
      token: "token-to-ignore",
      headers: { Authorization: "CustomAuth custom-value" },
      fetchFn: mockFetch,
    });

    // Assert
    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("CustomAuth custom-value");
  });

  it("throws ApiHttpError with status 401 on unauthorized response", async () => {
    // Arrange
    const create401Response = () =>
      new Response(JSON.stringify({ message: "Invalid or expired token" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      });
    const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(create401Response()));

    // Act & Assert
    await expect(
      apiFetch({
        endpoint: "/api/me",
        baseUrl: testBaseUrl,
        token: "expired-token",
        fetchFn: mockFetch,
      }),
    ).rejects.toThrow(ApiHttpError);

    try {
      await apiFetch({
        endpoint: "/api/me",
        baseUrl: testBaseUrl,
        token: "expired-token",
        fetchFn: mockFetch,
      });
      expect.unreachable();
    } catch (error) {
      const httpError = error as ApiHttpError;
      expect(httpError.status).toBe(401);
      expect(httpError.statusText).toBe("Unauthorized");
    }
  });

  it("passes FormData body directly and omits Content-Type header so fetch can set boundary", async () => {
    // Arrange
    const mockData = { id: "post-1", imageUrl: "https://example.com/p.jpg" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const formData = new FormData();
    formData.append("caption", "A test multipart post");

    // Act
    const result = await apiFetch({
      endpoint: "/api/posts",
      method: "POST",
      body: formData,
      token: "secret-bearer-token",
      baseUrl: testBaseUrl,
      fetchFn: mockFetch,
    });

    // Assert
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe("https://example.com/api/posts");
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].body).toBe(formData);
    const passedHeaders = callArgs[1].headers as Headers;
    expect(passedHeaders.has("Content-Type")).toBe(false);
    expect(passedHeaders.get("Accept")).toBe("application/json");
    expect(passedHeaders.get("Authorization")).toBe("Bearer secret-bearer-token");
  });
});
