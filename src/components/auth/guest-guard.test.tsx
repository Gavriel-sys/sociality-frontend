import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { makeStore, type AppStore } from "@/lib/store/store";
import { GuestGuard } from "./guest-guard";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("GuestGuard", () => {
  let store: AppStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    mockSearchParams = new URLSearchParams();
  });

  function renderWithStore(ui: ReactNode, customStore: AppStore = store) {
    return render(<Provider store={customStore}>{ui}</Provider>);
  }

  it("renders children when status is unauthenticated and does not redirect", () => {
    // Arrange
    store.dispatch(clearSession());

    // Act
    renderWithStore(
      <GuestGuard>
        <div data-testid="guest-content">Login Form</div>
      </GuestGuard>,
    );

    // Assert
    expect(screen.getByTestId("guest-content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders children when status is idle (initial hydration) and does not redirect", () => {
    // Arrange: store starts in idle state
    expect(store.getState().auth.status).toBe("idle");

    // Act
    renderWithStore(
      <GuestGuard>
        <div data-testid="guest-content">Login Form</div>
      </GuestGuard>,
    );

    // Assert
    expect(screen.getByTestId("guest-content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects authenticated user to /me by default and hides children", () => {
    // Arrange
    store.dispatch(
      setSession({
        token: "active-token",
        sessionId: "active-session",
        user: { username: "active_user" },
      }),
    );

    // Act
    renderWithStore(
      <GuestGuard>
        <div data-testid="guest-content">Login Form</div>
      </GuestGuard>,
    );

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/me");
    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
  });

  it("redirects authenticated user to validated safe returnTo parameter", () => {
    // Arrange
    store.dispatch(
      setSession({
        token: "active-token",
        sessionId: "active-session",
      }),
    );
    mockSearchParams = new URLSearchParams("returnTo=/feed%3Ftab%3Dpopular");

    // Act
    renderWithStore(
      <GuestGuard>
        <div data-testid="guest-content">Login Form</div>
      </GuestGuard>,
    );

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/feed?tab=popular");
    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
  });

  it("sanitizes malicious returnTo to safe fallback /me when redirecting", () => {
    // Arrange
    store.dispatch(
      setSession({
        token: "active-token",
        sessionId: "active-session",
      }),
    );
    mockSearchParams = new URLSearchParams("returnTo=https://evil.com/phish");

    // Act
    renderWithStore(
      <GuestGuard>
        <div data-testid="guest-content">Login Form</div>
      </GuestGuard>,
    );

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/me");
  });
});
