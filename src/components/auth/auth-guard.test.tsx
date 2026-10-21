import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { makeStore, type AppStore } from "@/lib/store/store";
import { AuthGuard } from "./auth-guard";

const mockPush = vi.fn();
let mockPathname = "/feed";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("AuthGuard", () => {
  let store: AppStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    mockPathname = "/feed";
    mockSearchParams = new URLSearchParams();
  });

  function renderWithStore(ui: ReactNode, customStore: AppStore = store) {
    return render(<Provider store={customStore}>{ui}</Provider>);
  }

  it("renders loading fallback while auth status is idle and does not redirect", () => {
    // Arrange: initial state is idle
    expect(store.getState().auth.status).toBe("idle");

    // Act
    renderWithStore(
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>,
    );

    // Assert
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Verifying session...")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders custom fallback while idle when provided", () => {
    // Arrange & Act
    renderWithStore(
      <AuthGuard fallback={<div data-testid="custom-spinner">Checking...</div>}>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>,
    );

    // Assert
    expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login with encoded returnTo", () => {
    // Arrange
    store.dispatch(clearSession());
    mockPathname = "/profile/settings";
    mockSearchParams = new URLSearchParams("tab=security&ref=banner");

    // Act
    renderWithStore(
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>,
    );

    // Assert
    const expectedReturnTo = encodeURIComponent("/profile/settings?tab=security&ref=banner");
    expect(mockPush).toHaveBeenCalledWith(`/login?returnTo=${expectedReturnTo}`);
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders protected children when user is authenticated and does not redirect", () => {
    // Arrange
    store.dispatch(
      setSession({
        token: "valid-jwt",
        sessionId: "sess-123",
        user: { username: "gavriel" },
      }),
    );

    // Act
    renderWithStore(
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>,
    );

    // Assert
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
