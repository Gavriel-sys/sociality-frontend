import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatePostDialog } from "./create-post-dialog";

const mockCreatePost = vi.fn();
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock("../use-create-post", () => ({
  useCreatePost: () => ({
    createPost: mockCreatePost,
    isLoading: mockIsLoading,
    isError: Boolean(mockError),
    error: mockError,
  }),
}));

describe("CreatePostDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockError = null;
    globalThis.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-preview");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("renders when open and hides when closed", () => {
    const { rerender } = render(<CreatePostDialog isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<CreatePostDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Add Post" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add Post" })).toBeInTheDocument();
    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("Click to upload")).toBeInTheDocument();
    expect(screen.getByText("PNG or JPG (max. 5mb)")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveAttribute("placeholder", "Create your caption");
    expect(screen.getByRole("button", { name: "Share" })).toBeEnabled();
    expect(screen.queryByText("0/500")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("rejects non-image files and displays error alert", () => {
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const input = screen.getByTestId("file-input");
    const badFile = new File(["not an image"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a PNG, JPEG, or WebP image.");
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("rejects files larger than 5MB and displays size error alert", () => {
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const input = screen.getByTestId("file-input");
    const oversized = new File([new Uint8Array(10)], "big.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 6 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Image size must not exceed 5MB.");
  });

  it("handles valid image selection, renders preview, tracks caption count, and submits post", async () => {
    mockCreatePost.mockResolvedValueOnce({ id: "post-1" });
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const file = new File(["valid-image"], "cat.png", { type: "image/png" });

    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });
    expect(screen.getByAltText("Selected preview")).toHaveAttribute("src", "blob:http://localhost/mock-preview");
    expect(screen.getByRole("button", { name: "Change Image" })).toBeInTheDocument();

    const captionInput = screen.getByRole("textbox", { name: "Caption" });
    fireEvent.change(captionInput, { target: { value: "A wonderful cat" } });
    expect(screen.getByText("15/500")).toBeInTheDocument();

    const shareButton = screen.getByRole("button", { name: "Share" });
    expect(shareButton).toBeEnabled();
    fireEvent.click(shareButton);

    expect(mockCreatePost).toHaveBeenCalledWith({ image: file, caption: "A wonderful cat" });
  });

  it("supports drag & drop file upload and back button", () => {
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const dropzone = screen.getByLabelText("Drag and drop image here or click to browse");
    const file = new File(["dropped-data"], "drop.webp", { type: "image/webp" });

    fireEvent.dragOver(dropzone);
    fireEvent.dragLeave(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(screen.getByAltText("Selected preview")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-preview");
    expect(screen.queryByAltText("Selected preview")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveValue("");
  });

  it("opens the file picker from the upload area", () => {
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const openPicker = vi.spyOn(screen.getByLabelText("Upload image"), "click");

    fireEvent.click(screen.getByRole("button", { name: "Drag and drop image here or click to browse" }));

    expect(openPicker).toHaveBeenCalledOnce();
  });

  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s at the 5MB boundary", (type) => {
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const file = new File(["image"], "photo", { type });
    Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

    fireEvent.change(screen.getByLabelText("Upload image"), { target: { files: [file] } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeEnabled();
  });

  it("prevents submission while an upload is pending", () => {
    mockIsLoading = true;
    render(<CreatePostDialog isOpen={true} onClose={onClose} />);
    const file = new File(["image"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload image"), { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
