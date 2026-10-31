import { act } from "@testing-library/react";
import type { ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { makeStore, type AppStore } from "@/lib/store/store";
import { AuthGuard } from "./auth-guard";
import { GuestGuard } from "./guest-guard";

const mockPush = vi.fn();
const searchParams = new URLSearchParams();
let pathname = "/feed";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

const guardScenarios = [
  { name: "AuthGuard", Guard: AuthGuard, path: "/feed", content: "Private feed" },
  { name: "GuestGuard on login", Guard: GuestGuard, path: "/login", content: "Login form" },
  { name: "GuestGuard on register", Guard: GuestGuard, path: "/register", content: "Register form" },
] as const;

function authenticateStore(store: AppStore): void {
  store.dispatch(setSession({ token: "stored-session-token", sessionId: "stored-session" }));
}

function withStore(store: AppStore, content: ReactElement): ReactElement {
  return <Provider store={store}>{content}</Provider>;
}

describe("auth guard hydration", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
  });

  it.each(guardScenarios)("$name always server renders the default fallback", ({ Guard, path, content }) => {
    pathname = path;
    const store = makeStore();
    authenticateStore(store);

    container.innerHTML = renderToString(withStore(store, <Guard><header>{content}</header></Guard>));

    expect(container.textContent).toContain("Verifying session...");
    expect(container.querySelector("header")).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each(guardScenarios)("$name honors a custom fallback during SSR", ({ Guard, path, content }) => {
    pathname = path;
    const store = makeStore();
    const view = <Guard fallback={<p>Checking session</p>}><header>{content}</header></Guard>;

    container.innerHTML = renderToString(withStore(store, view));

    expect(container.textContent).toBe("Checking session");
    expect(container.querySelector("header")).toBeNull();
  });

  it.each(guardScenarios)("$name hydrates an idle server with a stored session", async ({ Guard, path, content }) => {
    pathname = path;
    const serverStore = makeStore();
    const clientStore = makeStore();
    authenticateStore(clientStore);
    const view = <Guard><header>{content}</header></Guard>;
    const onRecoverableError = vi.fn();
    container.innerHTML = renderToString(withStore(serverStore, view));

    await act(async () => {
      root = hydrateRoot(container, withStore(clientStore, view), { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    if (Guard === AuthGuard) {
      expect(container.textContent).toBe(content);
      expect(mockPush).not.toHaveBeenCalled();
    } else {
      expect(container.textContent).toContain("Verifying session...");
      expect(container.querySelector("header")).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/me");
    }
  });

  it.each(guardScenarios.slice(1))("$name hydrates a signed-out client", async ({ Guard, path, content }) => {
    pathname = path;
    const clientStore = makeStore();
    clientStore.dispatch(clearSession());
    const view = <Guard><header>{content}</header></Guard>;
    const onRecoverableError = vi.fn();
    container.innerHTML = renderToString(withStore(makeStore(), view));

    await act(async () => {
      root = hydrateRoot(container, withStore(clientStore, view), { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe(content);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
