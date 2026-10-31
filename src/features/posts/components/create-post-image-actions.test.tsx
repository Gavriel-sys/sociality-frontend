import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatePostDialog } from "./create-post-dialog";

const createPost = vi.fn();
vi.mock("../use-create-post", () => ({
  useCreatePost: () => ({ createPost, isLoading: false }),
}));

beforeEach(() => {
  createPost.mockReset();
  globalThis.URL.createObjectURL = vi.fn().mockReturnValueOnce("blob:first").mockReturnValue("blob:replacement");
  globalThis.URL.revokeObjectURL = vi.fn();
});

function selectImage(file: File) {
  fireEvent.change(screen.getByLabelText("Upload image"), { target: { files: [file] } });
}

function writeCaption() {
  fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: "My photo" } });
}

describe("CreatePostDialog image actions", () => {
  it("shows Change Image and Delete Image only after an image is selected", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Change Image" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Image" })).not.toBeInTheDocument();

    selectImage(new File(["photo"], "photo.png", { type: "image/png" }));

    expect(screen.getByRole("button", { name: "Change Image" }).querySelector("img"))
      .toHaveAttribute("src", "/icons/phase-arrow.svg");
    expect(screen.getByRole("button", { name: "Delete Image" }).querySelector("img"))
      .toHaveAttribute("src", "/icons/trash.svg");
  });

  it("opens the picker, replaces the selected image, and submits the replacement with the caption", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    selectImage(new File(["original"], "original.png", { type: "image/png" }));
    writeCaption();
    const openPicker = vi.spyOn(screen.getByLabelText("Upload image"), "click");
    const replacement = new File(["replacement"], "replacement.webp", { type: "image/webp" });

    fireEvent.click(screen.getByRole("button", { name: "Change Image" }));
    expect(openPicker).toHaveBeenCalledOnce();
    expect(createPost).not.toHaveBeenCalled();
    selectImage(replacement);

    expect(screen.getByAltText("Selected preview")).toHaveAttribute("src", "blob:replacement");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveValue("My photo");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(createPost).toHaveBeenCalledWith({ image: replacement, caption: "My photo" });
  });

  it("keeps the existing image when a replacement fails validation", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    const original = new File(["original"], "original.png", { type: "image/png" });
    selectImage(original);
    writeCaption();

    selectImage(new File(["invalid"], "notes.txt", { type: "text/plain" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a PNG, JPEG, or WebP image.");
    expect(screen.getByAltText("Selected preview")).toHaveAttribute("src", "blob:first");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(createPost).toHaveBeenCalledWith({ image: original, caption: "My photo" });
  });

  it("keeps the image and caption when the replacement picker is cancelled", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    selectImage(new File(["original"], "original.png", { type: "image/png" }));
    writeCaption();

    fireEvent.change(screen.getByLabelText("Upload image"), { target: { files: [] } });

    expect(screen.getByAltText("Selected preview")).toHaveAttribute("src", "blob:first");
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveValue("My photo");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("deletes the image, retains the caption, and requires a new selection before posting", () => {
    render(<CreatePostDialog isOpen onClose={vi.fn()} />);
    const photo = new File(["photo"], "photo.png", { type: "image/png" });
    selectImage(photo);
    writeCaption();

    fireEvent.click(screen.getByRole("button", { name: "Delete Image" }));

    expect(screen.queryByAltText("Selected preview")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Image" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drag and drop image here or click to browse" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveValue("My photo");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(screen.getByLabelText("Upload image")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a photo.");
    expect(createPost).not.toHaveBeenCalled();

    selectImage(photo);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(createPost).toHaveBeenCalledWith({ image: photo, caption: "My photo" });
  });
});
