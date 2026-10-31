import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileShareButton } from "./profile-share-button";

afterEach(() => vi.restoreAllMocks());

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
}

describe("profile sharing", () => {
  it("copies the full public URL and confirms success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ProfileShareButton username="alexriver" />);

    fireEvent.click(screen.getByRole("button", { name: "Share profile" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied!"));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/profile/alexriver`);
  });

  it("reports a clipboard failure without claiming it copied", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("Permission denied")));
    render(<ProfileShareButton username="alexriver" />);

    fireEvent.click(screen.getByRole("button", { name: "Share profile" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Unable to copy link"));
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("disables sharing when a username is unavailable", () => {
    render(<ProfileShareButton username="" />);
    expect(screen.getByRole("button", { name: "Share profile" })).toBeDisabled();
  });
});
