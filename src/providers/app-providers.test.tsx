import { useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as sessionStorageModule from "@/features/auth/session-storage";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/store/hooks";
import { makeStore } from "@/lib/store/store";
import { toggleNavigation } from "@/lib/store/ui-slice";
import { AppProviders } from "./app-providers";

function TestConsumer({
  onStore,
  onQueryClient,
}: {
  onStore?: (store: unknown) => void;
  onQueryClient?: (client: unknown) => void;
}) {
  const store = useAppStore();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isNavOpen = useAppSelector((state) => state.ui.isNavigationOpen);

  if (onStore !== undefined) onStore(store);
  if (onQueryClient !== undefined) onQueryClient(queryClient);

  return (
    <div>
      <span data-testid="nav-status">{isNavOpen ? "open" : "closed"}</span>
      <button type="button" onClick={() => dispatch(toggleNavigation())}>
        Toggle
      </button>
    </div>
  );
}

function AuthStatusConsumer() {
  const auth = useAppSelector((state) => state.auth);
  return (
    <div>
      <span data-testid="auth-status">{auth.status}</span>
      <span data-testid="auth-token">{auth.token ?? "none"}</span>
    </div>
  );
}

function WrapperWithRerender({
  onStore,
  onQueryClient,
}: {
  onStore: (store: unknown) => void;
  onQueryClient: (client: unknown) => void;
}) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Rerender Parent ({count})
      </button>
      <AppProviders>
        <TestConsumer onStore={onStore} onQueryClient={onQueryClient} />
      </AppProviders>
    </div>
  );
}

describe("AppProviders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children and provides Redux and Query contexts", () => {
    render(
      <AppProviders>
        <TestConsumer />
      </AppProviders>,
    );
    expect(screen.getByTestId("nav-status")).toHaveTextContent("closed");
  });

  it("preserves store and queryClient instances across parent component rerenders", () => {
    const storesSeen: unknown[] = [];
    const clientsSeen: unknown[] = [];

    render(
      <WrapperWithRerender
        onStore={(s) => storesSeen.push(s)}
        onQueryClient={(c) => clientsSeen.push(c)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Rerender Parent/i }));

    expect(storesSeen.length).toBeGreaterThan(1);
    expect(storesSeen[0]).toBe(storesSeen[1]);
    expect(clientsSeen.length).toBeGreaterThan(1);
    expect(clientsSeen[0]).toBe(clientsSeen[1]);
  });

  it("hydrates active session into Redux when storage contains a valid session", () => {
    vi.spyOn(sessionStorageModule, "loadSession").mockReturnValue({
      token: "hydrated-jwt-123",
      sessionId: "session-456",
      user: { username: "hydrated_user" },
    });
    const store = makeStore();

    render(
      <AppProviders store={store}>
        <AuthStatusConsumer />
      </AppProviders>,
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("auth-token")).toHaveTextContent("hydrated-jwt-123");
  });

  it("dispatches clearSession into Redux when storage contains no session", () => {
    vi.spyOn(sessionStorageModule, "loadSession").mockReturnValue(null);
    const store = makeStore();

    render(
      <AppProviders store={store}>
        <AuthStatusConsumer />
      </AppProviders>,
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
    expect(screen.getByTestId("auth-token")).toHaveTextContent("none");
  });
});
