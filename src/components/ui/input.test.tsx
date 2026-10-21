import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
  it("renders with associated label", () => {
    render(<Input label="Username" placeholder="Enter username" />);
    const input = screen.getByLabelText("Username");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Enter username");
  });

  it("renders error message with accessible aria-invalid and aria-describedby", () => {
    render(<Input label="Email" error="Invalid email address" />);
    const input = screen.getByLabelText("Email");
    const errorMsg = screen.getByRole("alert");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", errorMsg.id);
    expect(errorMsg).toHaveTextContent("Invalid email address");
  });

  it("renders helper text and associates it via aria-describedby", () => {
    render(<Input label="Bio" helperText="Maximum 160 characters" />);
    const input = screen.getByLabelText("Bio");
    const helper = screen.getByText("Maximum 160 characters");

    expect(input).toHaveAttribute("aria-describedby", helper.id);
  });

  it("renders disabled state with disabled attribute", () => {
    render(<Input label="Disabled" disabled defaultValue="Fixed" />);
    const input = screen.getByLabelText("Disabled");

    expect(input).toBeDisabled();
    expect(input).toHaveValue("Fixed");
  });
});
