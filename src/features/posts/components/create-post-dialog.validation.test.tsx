import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatePostDialog } from "./create-post-dialog";

const createPost = vi.fn();
vi.mock("../use-create-post", () => ({
  useCreatePost: () => ({ createPost, isLoading: false }),
}));

beforeEach(() => {
  createPost.mockReset();
  globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
  globalThis.URL.revokeObjectURL = vi.fn();
});

function selectPhoto() {
  const file = new File(["photo"], "photo.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Upload image"), { target: { files: [file] } });
}

function sharePost() {
  fireEvent.click(screen.getByRole("button", { name: "Share" }));
}

describe("CreatePostDialog required fields", () => {
  it("shows both field errors only after Share is clicked", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    sharePost();

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getByLabelText("Upload image")).toHaveAccessibleDescription("Please upload a photo.");
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveAccessibleDescription("Please enter a caption.");
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveAttribute("aria-invalid", "true");
    expect(createPost).not.toHaveBeenCalled();
  });

  it.each(["", "   "])("rejects an empty or whitespace caption after selecting a photo", (caption) => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    selectPhoto();
    fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: caption } });

    sharePost();

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a caption.");
    expect(createPost).not.toHaveBeenCalled();
  });

  it("requires a photo when the caption is filled", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: "My photo" } });

    sharePost();

    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a photo.");
    expect(createPost).not.toHaveBeenCalled();
  });

  it("clears each error as the corresponding field is corrected and allows submission", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    sharePost();

    selectPhoto();
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a caption.");
    fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: "My photo" } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    sharePost();
    expect(createPost).toHaveBeenCalledWith({ image: expect.any(File), caption: "My photo" });
  });

  it("resets field errors after closing and reopening", () => {
    const onClose = vi.fn();
    const view = render(<CreatePostDialog isOpen onClose={onClose} />);
    sharePost();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    view.rerender(<CreatePostDialog isOpen={false} onClose={onClose} />);
    view.rerender(<CreatePostDialog isOpen onClose={onClose} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
