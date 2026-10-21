import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./password-input";

describe("PasswordInput component", () => {
  it("renders with type password and show password button initially", () => {
    // Arrange
    render(<PasswordInput label="Password" placeholder="Enter password" />);

    // Act
    const input = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    // Assert
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-label", "Show password");
  });

  it("toggles input type between password and text and updates aria-label on click", () => {
    // Arrange
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    // Act 1: Click to show password
    fireEvent.click(toggleButton);

    // Assert 1
    expect(input).toHaveAttribute("type", "text");
    expect(toggleButton).toHaveAttribute("aria-label", "Hide password");

    // Act 2: Click to hide password again
    fireEvent.click(toggleButton);

    // Assert 2
    expect(input).toHaveAttribute("type", "password");
    expect(toggleButton).toHaveAttribute("aria-label", "Show password");
  });

  it("renders error state with accessible role and aria attributes", () => {
    // Arrange
    render(<PasswordInput label="Password" error="Password is required" />);

    // Act
    const input = screen.getByLabelText("Password");
    const errorAlert = screen.getByRole("alert");

    // Assert
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(errorAlert).toHaveTextContent("Password is required");
  });

  it("disables both the input and toggle button when disabled", () => {
    // Arrange
    render(<PasswordInput label="Password" disabled />);

    // Act
    const input = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    // Assert
    expect(input).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });
});
