import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

const registration = {
  name: "Gilbert Doe", username: "gilbert_123", email: "gilbert@example.com", phone: "08123456789",
  password: "secret123", confirmPassword: "secret123",
};
const labels = { name: "Name", username: "Username", email: "Email", phone: "Number Phone", password: "Password", confirmPassword: "Confirm Password" };

function fillRegistration(overrides: Partial<typeof registration> = {}) {
  const values = { ...registration, ...overrides };
  for (const field of Object.keys(labels) as Array<keyof typeof labels>) {
    fireEvent.change(screen.getByLabelText(labels[field]), { target: { value: values[field] } });
  }
}

function submitRegistration() {
  fireEvent.click(screen.getByRole("button", { name: /Submit/ }));
}

describe("RegisterForm", () => {
  it("renders six fields in order with matching placeholders and login navigation", () => {
    render(<RegisterForm onSubmit={vi.fn()} />);
    expect(Array.from(screen.getByRole("form", { name: "Register" }).querySelectorAll("input"), (input) => input.id))
      .toEqual(Object.keys(labels).map((name) => `register-${name}`));
    expect(screen.getByPlaceholderText("Enter your name")).toHaveAccessibleName("Name");
    expect(screen.getByPlaceholderText("Enter your username")).toHaveAccessibleName("Username");
    expect(screen.getByPlaceholderText("Enter your email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Number Phone")).not.toBeRequired();
    expect(screen.getByPlaceholderText("Enter your number phone")).toHaveAttribute("type", "tel");
    expect(screen.getByPlaceholderText("Enter your password")).toHaveAttribute("type", "password");
    expect(screen.getByPlaceholderText("Enter your confirm password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows accessible errors for required fields and focuses the first invalid input", async () => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    submitRegistration();
    expect(await screen.findAllByRole("alert")).toHaveLength(5);
    for (const label of ["Name", "Username", "Email", "Password", "Confirm Password"]) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription();
    }
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ["ab", "Username must be at least 3 characters"],
    ["user-name", "Username can only contain letters, numbers, and underscores"],
  ])("rejects invalid username %s", async (username, message) => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration({ username });
    submitRegistration();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("rejects short passwords and mismatched confirmation", async () => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration({ password: "short" });
    submitRegistration();
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed registration values including email", async () => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration({ name: "  Gilbert Doe  ", username: " gilbert_123 ", email: " gilbert@example.com ", phone: " 08123456789 " });
    submitRegistration();
    await waitFor(() => expect(handleSubmit).toHaveBeenCalledExactlyOnceWith(registration));
  });

  it.each(["", "invalid-email"])("blocks missing or invalid email %s", async (email) => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration({ email });
    submitRegistration();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("allows registration without a phone number", async () => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration({ phone: "" });
    submitRegistration();
    await waitFor(() => expect(handleSubmit).toHaveBeenCalledExactlyOnceWith({ ...registration, phone: undefined }));
  });

  it("reveals each password independently without changing its value or submitting", () => {
    const handleSubmit = vi.fn();
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Show confirm password" }));
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm Password")).toHaveValue("secret123");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("disables all controls while an async submission is pending", async () => {
    let finishSubmission: (() => void) | undefined;
    const handleSubmit = vi.fn(() => new Promise<void>((resolve) => { finishSubmission = resolve; }));
    render(<RegisterForm onSubmit={handleSubmit} />);
    fillRegistration();
    submitRegistration();
    await waitFor(() => expect(screen.getByRole("button", { name: /Submit/ })).toBeDisabled());
    expect(screen.getByLabelText("Confirm Password")).toBeDisabled();
    submitRegistration();
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    await act(async () => finishSubmission?.());
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  it("disables fields and visibility controls when loading externally", () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading />);
    for (const label of Object.values(labels)) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: /Submit/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show confirm password" })).toBeDisabled();
  });

  it("announces server errors", () => {
    render(<RegisterForm onSubmit={vi.fn()} serverError="Username already in use." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Username already in use.");
  });
});
