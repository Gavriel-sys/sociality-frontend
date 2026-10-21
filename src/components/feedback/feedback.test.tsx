import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

describe("Feedback components", () => {
  it("renders LoadingState with accessible status and busy state", () => {
    render(<LoadingState message="Fetching data..." description="Please wait" />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });

  it("renders EmptyState and triggers action callback", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No items found"
        description="Try adjusting your filters"
        action={{ label: "Add Item", onClick: handleAction }}
      />,
    );

    expect(screen.getByRole("region", { name: "No items found" })).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();

    const actionButton = screen.getByRole("button", { name: "Add Item" });
    fireEvent.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("renders ErrorState with role alert and triggers retry callback", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Server unreachable"
        message="Please check your internet connection."
        onRetry={handleRetry}
        retryLabel="Retry request"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Server unreachable")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry request/i });
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
