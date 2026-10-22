import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./date-utils";

describe("formatRelativeTime", () => {
  const baseTime = "2026-10-22T12:00:00.000Z";

  it("returns 'Recently' for undefined, null, or empty string", () => {
    expect(formatRelativeTime(undefined)).toBe("Recently");
    expect(formatRelativeTime(null)).toBe("Recently");
    expect(formatRelativeTime("")).toBe("Recently");
  });

  it("returns 'Recently' for invalid date strings", () => {
    expect(formatRelativeTime("not-a-valid-date")).toBe("Recently");
    expect(formatRelativeTime("invalid-iso-9999-99-99")).toBe("Recently");
  });

  it("returns 'Just now' for timestamps within the last 59 seconds or future dates", () => {
    expect(formatRelativeTime("2026-10-22T11:59:30.000Z", baseTime)).toBe("Just now");
    expect(formatRelativeTime("2026-10-22T12:00:05.000Z", baseTime)).toBe("Just now");
  });

  it("returns 'Xm ago' for timestamps between 1 and 59 minutes ago", () => {
    expect(formatRelativeTime("2026-10-22T11:55:00.000Z", baseTime)).toBe("5m ago");
    expect(formatRelativeTime("2026-10-22T11:01:00.000Z", baseTime)).toBe("59m ago");
  });

  it("returns 'Xh ago' for timestamps between 1 and 23 hours ago", () => {
    expect(formatRelativeTime("2026-10-22T10:00:00.000Z", baseTime)).toBe("2h ago");
    expect(formatRelativeTime("2026-10-21T13:00:00.000Z", baseTime)).toBe("23h ago");
  });

  it("returns 'Xd ago' for timestamps between 1 and 6 days ago", () => {
    expect(formatRelativeTime("2026-10-21T12:00:00.000Z", baseTime)).toBe("1d ago");
    expect(formatRelativeTime("2026-10-16T12:00:00.000Z", baseTime)).toBe("6d ago");
  });

  it("returns formatted 'DD MMM YYYY' for dates 7 days ago or older", () => {
    expect(formatRelativeTime("2026-10-15T12:00:00.000Z", baseTime)).toBe("15 Oct 2026");
    expect(formatRelativeTime("2025-01-01T00:00:00.000Z", baseTime)).toBe("01 Jan 2025");
  });
});
