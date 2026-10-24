import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommentInputForm } from "./comment-input-form";

describe("CommentInputForm", () => {
  it("renders input field and Post button in initial disabled state", () => {
    render(<CommentInputForm onSubmit={vi.fn()} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    const submitButton = screen.getByRole("button", { name: /post/i });

    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(submitButton).toBeDisabled();
  });

  it("updates input value on change and enables submit button when non-empty", () => {
    render(<CommentInputForm onSubmit={vi.fn()} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    const submitButton = screen.getByRole("button", { name: /post/i });

    fireEvent.change(input, { target: { value: "Brilliant shot!" } });
    expect(input).toHaveValue("Brilliant shot!");
    expect(submitButton).toBeEnabled();
  });

  it("calls onSubmit with trimmed text and clears input on success", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommentInputForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    const submitButton = screen.getByRole("button", { name: /post/i });

    fireEvent.change(input, { target: { value: "  A very clean comment.  " } });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith("A very clean comment.");
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("displays validation error on empty submit and does not call onSubmit", () => {
    const handleSubmit = vi.fn();
    render(<CommentInputForm onSubmit={handleSubmit} />);

    const form = screen.getByRole("form", { name: "Add a comment" });
    fireEvent.submit(form);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Comment cannot be empty");
  });

  it("retains input text and renders error message when onSubmit fails", async () => {
    const handleSubmit = vi.fn().mockRejectedValueOnce(new Error("Submission failed"));
    render(<CommentInputForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    const submitButton = screen.getByRole("button", { name: /post/i });

    fireEvent.change(input, { target: { value: "Failed message" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Submission failed");
    });
    expect(input).toHaveValue("Failed message");
  });

  it("disables input and button when isLoading is true", () => {
    render(<CommentInputForm onSubmit={vi.fn()} isLoading={true} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    const submitButton = screen.getByRole("button", { name: /post/i });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("respects custom placeholder when provided", () => {
    render(<CommentInputForm onSubmit={vi.fn()} placeholder="Write a reply..." />);

    expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
  });
});
