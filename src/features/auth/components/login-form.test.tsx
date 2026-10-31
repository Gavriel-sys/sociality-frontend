import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

describe("LoginForm component", () => {
  it("renders the auth fields, password visibility toggle, and registration link", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText("Enter your email")).toHaveAttribute("type", "email");
    const password = screen.getByPlaceholderText("Enter your password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/register");
  });

  it("displays validation errors on empty submission and does not call onSubmit", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("displays invalid email error when email format is invalid", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("displays short password error when password is less than 6 characters", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed email on valid submission", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  alice@example.com  " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "securepassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "securepassword",
    });
  });

  it("disables submit button and inputs during loading state", () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} isLoading={true} />);
    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });

  it("renders server error alert banner when serverError prop is provided", () => {
    const handleSubmit = vi.fn();
    render(
      <LoginForm
        onSubmit={handleSubmit}
        serverError="Invalid credentials provided. Please check your email or password."
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid credentials provided. Please check your email or password.");
  });
});
