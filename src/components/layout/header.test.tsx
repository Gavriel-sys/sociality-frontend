import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { makeStore } from "@/lib/store/store";
import { Header as SiteHeader } from "./header";
import type { HeaderProps } from "./header";

function Header(props: HeaderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  }));
  return <QueryClientProvider client={queryClient}><SiteHeader {...props} /></QueryClientProvider>;
}

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

function createAuthenticatedStore() {
  const store = makeStore();
  store.dispatch(setSession({ token: "header-token", sessionId: "header-session" }));
  return store;
}

describe("Header", () => {
  let hydrationRoot: Root | undefined;

  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(async () => {
    await act(async () => hydrationRoot?.unmount());
    hydrationRoot = undefined;
  });

  it("shows Login and Register links without a guest profile avatar", () => {
    const store = makeStore();
    store.dispatch(clearSession());
    render(<Provider store={store}><Header /></Provider>);

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    expect(screen.queryByLabelText("Current user profile")).not.toBeInTheDocument();
  });

  it("shows guest links when rendered without a store", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });

  it("shows the profile avatar for an authenticated user", () => {
    render(<Provider store={createAuthenticatedStore()}><Header userFallback="Alex River" /></Provider>);

    const profileLink = screen.getByRole("link", { name: "View your profile" });
    expect(profileLink).toHaveAttribute("href", "/me");
    expect(within(profileLink).getByLabelText("Current user profile")).toHaveTextContent("AR");
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });

  it("switches back to guest links after signing out", () => {
    const store = createAuthenticatedStore();
    render(<Provider store={store}><Header /></Provider>);

    act(() => { store.dispatch(clearSession()); });

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View your profile" })).not.toBeInTheDocument();
  });

  it("renders the decorative starburst brand and Search placeholder", () => {
    const { container } = render(<Header />);

    expect(screen.getByText("Sociality")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toHaveAccessibleName("Search");
    const logo = container.querySelector('img[src="/images/auth/sociality-starburst.svg"]');
    expect(logo).toHaveAttribute("alt", "");
    expect(logo).toHaveAttribute("width", "28");
    expect(logo).toHaveAttribute("height", "28");
  });

  it("submits trimmed search text and ignores an empty search", () => {
    render(<Header />);
    fireEvent.submit(screen.getByRole("search"));
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  Alex River  " } });
    fireEvent.submit(screen.getByRole("search"));

    expect(mockPush).toHaveBeenCalledExactlyOnceWith("/users/search?q=Alex%20River");
  });

  it("server renders guest links even when the store is authenticated", () => {
    const markup = renderToString(<Provider store={createAuthenticatedStore()}><Header /></Provider>);

    expect(markup).toContain('href="/login"');
    expect(markup).toContain('href="/register"');
    expect(markup).not.toContain('href="/me"');
  });

  it("hydrates a guest server with a saved client session without mismatches", async () => {
    const container = document.createElement("div");
    const onRecoverableError = vi.fn();
    container.innerHTML = renderToString(<Provider store={makeStore()}><Header /></Provider>);

    await act(async () => {
      hydrationRoot = hydrateRoot(container,
        <Provider store={createAuthenticatedStore()}><Header /></Provider>, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelector('a[href="/me"]')).toHaveAttribute("aria-label", "View your profile");
    expect(container.querySelector('a[href="/login"]')).toBeNull();
  });
});
