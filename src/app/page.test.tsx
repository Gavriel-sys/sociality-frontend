import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShowcasePage from "@/app/page";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { makeStore, type AppStore } from "@/lib/store/store";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

describe("ShowcasePage", () => {
  let store: AppStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
  });

  it("renders the primary heading and Stage 1C completion status message", () => {
    render(<ShowcasePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Sociality Design System Showcase" })).toBeInTheDocument();
    expect(screen.getByText(/Stage 1C completed/)).toBeInTheDocument();
  });

  it("renders core design system sections and component categories", () => {
    render(<ShowcasePage />);
    expect(screen.getByRole("heading", { level: 2, name: "Buttons" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Form Controls" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Tabs Navigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Avatars & Skeletons" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Feedback States" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Overlay Containers" })).toBeInTheDocument();
  });

  it("supports opening and closing desktop dialog modal", () => {
    render(<ShowcasePage />);
    fireEvent.click(screen.getByRole("button", { name: "Open Desktop Dialog" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Desktop Dialog Modal")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports switching tabs interactively", () => {
    render(<ShowcasePage />);
    const exploreTab = screen.getByRole("tab", { name: "Explore" });
    fireEvent.click(exploreTab);
    expect(exploreTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Explore tab panel active.")).toBeInTheDocument();
  });

  it("increments retry counter when error state retry is clicked", () => {
    render(<ShowcasePage />);
    const retryButton = screen.getByRole("button", { name: "Retry (0)" });
    fireEvent.click(retryButton);
    expect(screen.getByRole("button", { name: "Retry (1)" })).toBeInTheDocument();
  });

  it("redirects to /feed when user is authenticated", () => {
    store.dispatch(setSession({ token: "test-token", sessionId: "test-session" }));
    render(
      <Provider store={store}>
        <ShowcasePage />
      </Provider>,
    );
    expect(mockReplace).toHaveBeenCalledWith("/feed");
  });

  it("renders showcase landing when user is unauthenticated guest", () => {
    store.dispatch(clearSession());
    render(
      <Provider store={store}>
        <ShowcasePage />
      </Provider>,
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: "Sociality Design System Showcase" })).toBeInTheDocument();
  });
});
