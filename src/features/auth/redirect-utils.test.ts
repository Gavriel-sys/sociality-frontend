import { describe, expect, it } from "vitest";
import { getSafeReturnUrl } from "./redirect-utils";

describe("redirect-utils", () => {
  describe("getSafeReturnUrl", () => {
    it("preserves valid internal relative paths", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("/me")).toBe("/me");
      expect(getSafeReturnUrl("/feed")).toBe("/feed");
      expect(getSafeReturnUrl("/profile/gavriel")).toBe("/profile/gavriel");
      expect(getSafeReturnUrl("/search?query=sociality&sort=recent")).toBe(
        "/search?query=sociality&sort=recent",
      );
      expect(getSafeReturnUrl("/posts/42#comments")).toBe("/posts/42#comments");
    });

    it("applies the default fallback (/me) when target is null, undefined, or empty", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl(null)).toBe("/me");
      expect(getSafeReturnUrl(undefined)).toBe("/me");
      expect(getSafeReturnUrl("")).toBe("/me");
      expect(getSafeReturnUrl("   ")).toBe("/me");
    });

    it("applies a custom fallback when specified for empty or invalid targets", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl(null, "/custom-feed")).toBe("/custom-feed");
      expect(getSafeReturnUrl("https://evil.com", "/custom-feed")).toBe("/custom-feed");
    });

    it("rejects external absolute URLs", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("https://evil.com")).toBe("/me");
      expect(getSafeReturnUrl("http://attacker.com/steal")).toBe("/me");
      expect(getSafeReturnUrl("ftp://files.example.com")).toBe("/me");
    });

    it("rejects protocol-relative URLs", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("//evil.com")).toBe("/me");
      expect(getSafeReturnUrl("///evil.com")).toBe("/me");
      expect(getSafeReturnUrl("//localhost:3000/steal")).toBe("/me");
    });

    it("rejects backslash bypasses and Windows-style paths", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("/\\evil.com")).toBe("/me");
      expect(getSafeReturnUrl("/\\\\evil.com")).toBe("/me");
      expect(getSafeReturnUrl("\\\\evil.com")).toBe("/me");
      expect(getSafeReturnUrl("/profile\\settings")).toBe("/me");
    });

    it("rejects executable and non-http protocol schemes", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("javascript:alert(1)")).toBe("/me");
      expect(getSafeReturnUrl("data:text/html,<script>alert(1)</script>")).toBe("/me");
      expect(getSafeReturnUrl("vbscript:msgbox(1)")).toBe("/me");
    });

    it("rejects path traversal attempts", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("/..")).toBe("/me");
      expect(getSafeReturnUrl("/../")).toBe("/me");
      expect(getSafeReturnUrl("/../secret")).toBe("/me");
      expect(getSafeReturnUrl("/feed/..")).toBe("/me");
      expect(getSafeReturnUrl("/feed/../admin")).toBe("/me");
    });

    it("rejects encoded path traversal attempts", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("/%2e%2e")).toBe("/me");
      expect(getSafeReturnUrl("/%2e%2e/admin")).toBe("/me");
      expect(getSafeReturnUrl("/%2E%2E/admin")).toBe("/me");
      expect(getSafeReturnUrl("/feed/%2e%2e/dashboard")).toBe("/me");
    });

    it("rejects control characters and CRLF injection", () => {
      // Arrange & Act & Assert
      expect(getSafeReturnUrl("/me\r\nSet-Cookie:bad")).toBe("/me");
      expect(getSafeReturnUrl("/me\0something")).toBe("/me");
      expect(getSafeReturnUrl(" /me")).toBe("/me");
      expect(getSafeReturnUrl("/me ")).toBe("/me");
    });
  });
});
