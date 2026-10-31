import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import {
  finishSearchDebounce, matchedUser, mockSearchResponse, renderSearchHeader, typeSearch,
} from "./header-search-test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Header instant user search", () => {
  it("debounces typing and shows matching avatars, names and handles below the input", async () => {
    const apiSpy = mockSearchResponse();
    renderSearchHeader();
    typeSearch("jo");
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    typeSearch();

    expect(screen.getByRole("region", { name: "Search results" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(299); });
    expect(apiSpy).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(2); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("@johndoe")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "John Doe's avatar" })).toHaveAttribute("src", "/john.jpg");
    expect(screen.getByRole("link", { name: "View John Doe's profile" })).toHaveAttribute("href", "/profile/johndoe");
    expect(apiSpy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      endpoint: "/api/users/search?q=john&page=1&limit=20",
    }));
    expect(screen.getByRole("searchbox")).toHaveAttribute("aria-controls", screen.getByRole("region").id);
  });

  it("shows the Figma empty-state copy after a successful empty search", async () => {
    mockSearchResponse([]);
    renderSearchHeader();
    typeSearch("unknown");
    await finishSearchDebounce();

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByText("Change your keyword")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("does not search or open a dropdown for blank text", async () => {
    const apiSpy = mockSearchResponse();
    renderSearchHeader();
    typeSearch("   ");
    await finishSearchDebounce();

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("hides old results while the next keyword is being debounced", async () => {
    mockSearchResponse();
    renderSearchHeader();
    typeSearch();
    await finishSearchDebounce();
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    typeSearch("alice");

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Searching users");
  });

  it("keeps the loading state until the request finishes", async () => {
    const request = Promise.withResolvers<unknown>();
    vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(request.promise);
    renderSearchHeader();
    typeSearch();
    await finishSearchDebounce();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();

    await act(async () => { request.resolve({ users: [], total: 0 }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("offers retry for failed requests instead of claiming there are no results", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Search unavailable"));
    renderSearchHeader();
    typeSearch();
    await finishSearchDebounce();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to search users");
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();

    apiSpy.mockResolvedValue({ users: [matchedUser], total: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
