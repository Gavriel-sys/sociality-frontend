import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  finishSearchDebounce, mockSearchResponse, renderSearchHeader, typeSearch,
} from "./header-search-test-utils";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mockSearchResponse(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

async function openSearch() {
  renderSearchHeader();
  typeSearch();
  await finishSearchDebounce();
}

describe("Header search dismissal", () => {
  it("closes on Escape and reopens when the query changes", async () => {
    await openSearch();
    const isDefaultAllowed = fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

    expect(isDefaultAllowed).toBe(false);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("john");
    typeSearch("johnny");
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("closes on an outside pointer click and reopens on input focus", async () => {
    await openSearch();
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    fireEvent.focus(screen.getByRole("searchbox"));
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("stays open for pointer interactions inside the search input and panel", async () => {
    await openSearch();
    fireEvent.pointerDown(screen.getByRole("searchbox"));
    fireEvent.pointerDown(screen.getByRole("region"));

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("closes from the mobile search close button", async () => {
    await openSearch();
    fireEvent.click(screen.getByRole("button", { name: "Close search" }));

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("john");
  });

  it("closes when selecting the user's profile link", async () => {
    await openSearch();
    const profileLink = screen.getByRole("link", { name: "View John Doe's profile" });
    expect(profileLink).toHaveAttribute("href", "/profile/johndoe");
    profileLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(profileLink);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("clears the input and dropdown and reports the empty query", async () => {
    const onSearchChange = vi.fn();
    renderSearchHeader({ onSearchChange });
    typeSearch();
    await finishSearchDebounce();
    fireEvent.click(screen.getByRole("button", { name: "Clear header search" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(onSearchChange).toHaveBeenLastCalledWith("");
  });

  it("closes and preserves the existing full-search navigation on submit", async () => {
    await openSearch();
    fireEvent.submit(screen.getByRole("search"));

    expect(mockPush).toHaveBeenCalledExactlyOnceWith("/users/search?q=john");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("closes when keyboard focus leaves the search area", async () => {
    await openSearch();
    fireEvent.blur(screen.getByRole("searchbox"), { relatedTarget: screen.getByRole("link", { name: "Login" }) });

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("does not reopen when an in-flight request finishes after dismissal", async () => {
    renderSearchHeader();
    typeSearch();
    fireEvent.keyDown(document, { key: "Escape" });
    await finishSearchDebounce();

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("removes its global listeners on unmount", async () => {
    const removeListenerSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderSearchHeader();
    typeSearch();
    await finishSearchDebounce();
    act(unmount);

    expect(removeListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
