import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with children and accessible role", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("handles user click events when enabled", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prevents click interaction when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders accessible loading state and disables interaction", () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Processing</Button>);

    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies variant classes correctly", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-[#B41759]");

    rerender(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-[#1F242F]");
  });
});
