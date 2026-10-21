import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

describe("LoginForm component", () => {
  it("displays validation errors on empty submission and does not call onSubmit", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("displays invalid email error when email format is invalid", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("displays short password error when password is less than 6 characters", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed email on valid submission", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  alice@example.com  " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "securepassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "securepassword",
    });
  });

  it("disables submit button and inputs during loading state", () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} isLoading={true} />);

    // Assert
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });

  it("renders server error alert banner when serverError prop is provided", () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(
      <LoginForm
        onSubmit={handleSubmit}
        serverError="Invalid credentials provided. Please check your email or password."
      />,
    );

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid credentials provided. Please check your email or password.");
  });
});
