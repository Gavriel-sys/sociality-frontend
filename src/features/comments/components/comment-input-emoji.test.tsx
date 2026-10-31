import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommentInputForm } from "./comment-input-form";

describe("Comment input emoji picker", () => {
  it("inserts an emoji at the selection and submits it with the comment", async () => {
    const onSubmit = vi.fn();
    render(<CommentInputForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Good photo" } });
    input.setSelectionRange(4, 4);
    fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert 🥰" }));
    expect(input).toHaveValue("Good🥰 photo");
    expect(screen.queryByRole("group", { name: "Choose emoji" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Good🥰 photo"));
  });

  it("closes the picker on Escape without closing the comments view", () => {
    const onEscape = vi.fn();
    render(<div onKeyDown={onEscape}><CommentInputForm onSubmit={vi.fn()} /></div>);
    const trigger = screen.getByRole("button", { name: "Add emoji" });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("button", { name: "Insert 😀" }), { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("dismisses the picker on outside pointer input", () => {
    render(<CommentInputForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("group", { name: "Choose emoji" })).not.toBeInTheDocument();
  });

  it("disables emoji insertion while a comment is being submitted", () => {
    render(<CommentInputForm onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole("button", { name: "Add emoji" })).toBeDisabled();
  });

  it("prevents duplicate submissions while the first request is pending", async () => {
    let resolveSubmission: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmission = resolve; }));
    render(<CommentInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello" } });
    const form = screen.getByRole("form", { name: "Add a comment" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveSubmission();
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });
});
