import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import ExplorePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

describe("ExplorePage", () => {
  it("redirects the legacy route to the main feed", () => {
    expect(() => ExplorePage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/feed");
  });
});
