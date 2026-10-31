import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api-fetch";

const productionApiOrigin = "https://be-social-media-api-production.up.railway.app";
const postsEndpoint = "/api/posts?page=1&limit=10";

afterEach(() => vi.unstubAllEnvs());

describe("apiFetch deployment configuration", () => {
  it.each([undefined, "", "   "])("loads public posts when the API origin is %j", async (configuredOrigin) => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", configuredOrigin);
    const postsResponse = { data: { posts: [] } };
    const fetchPosts = vi.fn<typeof fetch>().mockResolvedValue(Response.json(postsResponse));

    const response = await apiFetch({ endpoint: postsEndpoint, fetchFn: fetchPosts });

    expect(response).toEqual(postsResponse);
    expect(fetchPosts).toHaveBeenCalledExactlyOnceWith(
      `${productionApiOrigin}${postsEndpoint}`, expect.objectContaining({ method: "GET" }),
    );
  });

  it("uses the configured backend instead of the production default", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://staging.example.com/");
    const fetchPosts = vi.fn<typeof fetch>().mockResolvedValue(Response.json([]));

    await apiFetch({ endpoint: postsEndpoint, fetchFn: fetchPosts });

    expect(fetchPosts).toHaveBeenCalledExactlyOnceWith(
      `https://staging.example.com${postsEndpoint}`, expect.any(Object),
    );
  });

  it("rejects a configured backend with an API path before sending a request", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://staging.example.com/api");
    const fetchPosts = vi.fn<typeof fetch>();

    await expect(apiFetch({ endpoint: postsEndpoint, fetchFn: fetchPosts }))
      .rejects.toThrow("API base URL must be a root origin with no path.");

    expect(fetchPosts).not.toHaveBeenCalled();
  });
});
