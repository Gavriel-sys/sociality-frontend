import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useAddComment } from "@/features/comments/use-add-comment";
import { createInteractionTestContext, jsonResponse } from "./test-support";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/feed" }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("posts trimmed comment text using the Railway request contract", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
  const fetchRequest = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
    data: { id: 7, text: "A new comment", author: { id: 1, username: "alex" } },
  }));
  vi.stubGlobal("fetch", fetchRequest);
  const { wrapper } = createInteractionTestContext();
  const { result } = renderHook(() => useAddComment(42), { wrapper });

  await act(async () => { await result.current.addComment("  A new comment  "); });

  const [url, request] = fetchRequest.mock.calls[0];
  expect(url).toBe("https://api.example.com/api/posts/42/comments");
  expect(request?.method).toBe("POST");
  expect(JSON.parse(String(request?.body))).toEqual({ text: "A new comment" });
});
