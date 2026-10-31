import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "../types";
import { EditProfileDialog } from "./edit-profile-dialog";

const mockEditProfile = vi.fn();
const mockReset = vi.fn();
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock("../use-edit-profile", () => ({
  useEditProfile: () => ({
    editProfile: mockEditProfile,
    isLoading: mockIsLoading,
    isError: Boolean(mockError),
    error: mockError,
    reset: mockReset,
  }),
}));

const mockProfile: UserProfile = {
  id: "user-42",
  name: "Alex Developer",
  username: "alexdev",
  email: "alex@example.com",
  bio: "Frontend engineer.",
  avatarUrl: "https://example.com/avatar.jpg",
  postsCount: 10,
  followersCount: 20,
  followingCount: 30, likesCount: 0,
};

describe("EditProfileDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockError = null;
    globalThis.URL.createObjectURL = vi.fn(() => "blob:http://localhost/new-avatar");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("renders initial values, read-only email, and bio counter", () => {
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Edit profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toHaveValue("Alex Developer");
    expect(screen.getByLabelText("Bio")).toHaveValue("Frontend engineer.");
    expect(screen.getByText("18/200")).toBeInTheDocument();

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveValue("alex@example.com");
    expect(emailInput).toBeDisabled();
    expect(screen.getByText("Email cannot be changed")).toBeInTheDocument();
  });

  it("validates required name and prevents submission when empty", () => {
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);

    const nameInput = screen.getByLabelText("Full Name");
    fireEvent.change(nameInput, { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(mockEditProfile).not.toHaveBeenCalled();
  });

  it("updates bio character count on typing", () => {
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);

    const bioInput = screen.getByLabelText("Bio");
    fireEvent.change(bioInput, { target: { value: "Hello world" } });
    expect(screen.getByText("11/200")).toBeInTheDocument();
  });

  it("validates avatar file type and size limits", () => {
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);
    const fileInput = screen.getByTestId("avatar-file-input");

    const badFile = new File(["not an image"], "doc.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [badFile] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Please upload a PNG, JPEG, or WebP image.");

    const bigFile = new File([new Uint8Array(10)], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Avatar image must not exceed 5MB.");
  });

  it("submits valid changes with updated avatar and closes dialog", async () => {
    mockEditProfile.mockResolvedValueOnce({ ...mockProfile, name: "Alex New", bio: "New bio" });
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);

    const file = new File(["avatar data"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-file-input"), { target: { files: [file] } });

    const nameInput = screen.getByLabelText("Full Name");
    fireEvent.change(nameInput, { target: { value: "Alex New" } });

    const bioInput = screen.getByLabelText("Bio");
    fireEvent.change(bioInput, { target: { value: "New bio" } });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mockEditProfile).toHaveBeenCalledWith({
      name: "Alex New",
      bio: "New bio",
      avatar: file,
    });
  });

  it("invokes onClose when Cancel button is clicked", () => {
    render(<EditProfileDialog isOpen={true} onClose={onClose} profile={mockProfile} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
