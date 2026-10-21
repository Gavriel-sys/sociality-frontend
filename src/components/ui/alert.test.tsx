import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/ui/alert";

describe("Alert component", () => {
  it("renders with role alert and title/content", () => {
    render(<Alert title="Warning">Please check your inputs</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Please check your inputs")).toBeInTheDocument();
  });

  it("renders success variant styling", () => {
    render(<Alert variant="success" title="Success">Saved</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("border-emerald-600/30");
  });

  it("renders danger variant styling by default", () => {
    render(<Alert title="Error">Failed</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("border-[#B41759]/40");
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<Alert title="Dismissible" onClose={handleClose}>Notice</Alert>);

    const dismissButton = screen.getByRole("button", { name: "Dismiss alert" });
    fireEvent.click(dismissButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
