import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import ScaffoldPage from "@/app/page";

test("identifies the scaffold with an accessible primary heading", () => {
  render(<ScaffoldPage />);

  const main = screen.getByRole("main");

  expect(within(main).getByRole("heading", {
    level: 1,
    name: "Sociality scaffold",
  })).toBeVisible();
});

test("states the completed stage and pending application capabilities", () => {
  render(<ScaffoldPage />);

  expect(screen.getByText("Stage 1B: application infrastructure completed.")).toBeVisible();
  expect(screen.getByText(
    "Authentication, feature API integration, and the design system are not implemented.",
  )).toBeVisible();
});
