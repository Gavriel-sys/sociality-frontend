import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchUser } from "@/features/users/types";
import * as searchHookModule from "@/features/users/use-search-users";
import { makeStore, type AppStore } from "@/lib/store/store";
import UsersSearchPage from "./page";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/users/search",
  useSearchParams: () => mockSearchParams,
}));

const mockUserA: SearchUser = {
  id: "u-1",
  name: "Alice Stark",
  username: "astark",
  avatarUrl: "https://example.com/astark.jpg",
  bio: "Engineer",
};

const mockUserB: SearchUser = {
  id: "u-2",
  name: "Bruce Banner",
  username: "bbanner",
};

describe("UsersSearchPage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function renderPage(ui: ReactNode = <UsersSearchPage />) {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </Provider>,
    );
  }

  function mockHook(overrides: Partial<searchHookModule.UseSearchUsersResult> = {}) {
    vi.spyOn(searchHookModule, "useSearchUsers").mockReturnValue({
      users: [],
      total: 0,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      debouncedQuery: "",
      ...overrides,
    });
  }

  it("renders initial prompt when query empty", () => {
    mockHook();
    renderPage();
    expect(screen.getByText("Find creators & friends")).toBeInTheDocument();
  });

  it("renders loading skeletons when loading", () => {
    mockSearchParams = new URLSearchParams("q=john");
    mockHook({ isLoading: true, debouncedQuery: "john" });
    renderPage();
    expect(screen.getByRole("status", { name: "Loading users" })).toBeInTheDocument();
    expect(screen.getAllByRole("status", { name: "Loading user" })).toHaveLength(4);
  });

  it("renders empty state on 0 results", () => {
    mockSearchParams = new URLSearchParams("q=unknown");
    mockHook({ users: [], total: 0, debouncedQuery: "unknown" });
    renderPage();
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders user list on results", () => {
    mockSearchParams = new URLSearchParams("q=star");
    mockHook({ users: [mockUserA, mockUserB], total: 2, debouncedQuery: "star" });
    renderPage();
    expect(screen.getByText("Alice Stark")).toBeInTheDocument();
    expect(screen.getByText("Bruce Banner")).toBeInTheDocument();
  });

  it("renders error state with retry button on failure", () => {
    mockSearchParams = new URLSearchParams("q=fail");
    const mockRefetch = vi.fn();
    mockHook({ isError: true, error: new Error("Search service down"), refetch: mockRefetch, debouncedQuery: "fail" });
    renderPage();
    expect(screen.getByText("Failed to load search results")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("clears search input when clear button clicked", () => {
    mockSearchParams = new URLSearchParams("q=clearable");
    mockHook({ users: [mockUserA], total: 1, debouncedQuery: "clearable" });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    const input = screen.getByRole("textbox", { name: "Search users" }) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("submitting header search form navigates to /users/search?q=...", () => {
    mockHook();
    renderPage();
    const headerInput = screen.getByPlaceholderText("Search");
    fireEvent.change(headerInput, { target: { value: "thor" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(mockPush).toHaveBeenCalledWith("/users/search?q=thor");
  });
});
