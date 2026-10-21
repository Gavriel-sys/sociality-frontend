import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

describe("RegisterForm component", () => {
  it("displays validation errors on empty submission and does not call onSubmit", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Username must be at least 3 characters")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("validates username length and regex constraints", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);

    // Act 1: Short username
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText("Username must be at least 3 characters")).toBeInTheDocument();

    // Act 2: Invalid regex character (dash)
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "user-name" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      await screen.findByText("Username can only contain letters, numbers, and underscores"),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("validates password minimum length requirement", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid registration data with optional phone transformed to undefined when blank", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Gilbert Doe  " } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "gilbert_123" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "gilbert@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "Gilbert Doe",
      username: "gilbert_123",
      email: "gilbert@example.com",
      password: "secret123",
      phone: undefined,
    });
  });

  it("submits valid registration data including phone number when provided", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);

    // Act
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Gilbert Doe" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "gilbert_123" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "gilbert@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "08123456789" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "Gilbert Doe",
      username: "gilbert_123",
      email: "gilbert@example.com",
      password: "secret123",
      phone: "08123456789",
    });
  });

  it("disables submit button and form controls in loading state", () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} isLoading={true} />);

    // Assert
    expect(screen.getByRole("button", { name: /create account/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Username")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
  });

  it("renders server error alert banner when serverError is passed", () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(
      <RegisterForm
        onSubmit={handleSubmit}
        serverError="Email or username already in use."
      />,
    );

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Email or username already in use.");
  });
});
