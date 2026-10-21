import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShowcasePage from "@/app/page";

describe("ShowcasePage", () => {
  it("renders the primary heading and Stage 1C completion status message", () => {
    render(<ShowcasePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sociality Design System Showcase",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Sociality Design System Showcase — Stage 1C completed. Feature API integration and authentication remain pending Stage 2+.",
      ),
    ).toBeInTheDocument();
  });

  it("renders core design system sections and component categories", () => {
    render(<ShowcasePage />);

    expect(screen.getByRole("heading", { level: 2, name: "Buttons" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Form Controls" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Tabs Navigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Avatars & Skeletons" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Feedback States" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Overlay Containers" })).toBeInTheDocument();
  });

  it("supports opening and closing desktop dialog modal", () => {
    render(<ShowcasePage />);

    const openDialogButton = screen.getByRole("button", { name: "Open Desktop Dialog" });
    fireEvent.click(openDialogButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Desktop Dialog Modal")).toBeInTheDocument();

    const closeButton = within(dialog).getByRole("button", { name: "Close dialog" });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports switching tabs interactively", () => {
    render(<ShowcasePage />);

    const exploreTab = screen.getByRole("tab", { name: "Explore" });
    fireEvent.click(exploreTab);

    expect(exploreTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Explore tab panel active.")).toBeInTheDocument();
  });

  it("increments retry counter when error state retry is clicked", () => {
    render(<ShowcasePage />);

    const retryButton = screen.getByRole("button", { name: "Retry (0)" });
    fireEvent.click(retryButton);

    expect(screen.getByRole("button", { name: "Retry (1)" })).toBeInTheDocument();
  });
});
