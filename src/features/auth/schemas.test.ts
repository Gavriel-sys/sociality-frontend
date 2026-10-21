import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    // Arrange & Act
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.password).toBe("securepassword");
    }
  });

  it("trims whitespace from email address", () => {
    // Arrange & Act
    const result = loginSchema.safeParse({
      email: "  user@example.com  ",
      password: "securepassword",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid email formats and empty email", () => {
    // Arrange & Act & Assert
    expect(loginSchema.safeParse({ email: "", password: "password123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "   ", password: "password123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "notanemail", password: "password123" }).success).toBe(
      false,
    );
  });

  it("rejects password shorter than 6 characters", () => {
    // Arrange & Act & Assert
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "12345" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    name: "Gilbert Doe",
    username: "gilbert_123",
    email: "gilbert@example.com",
    password: "securepassword",
  };

  it("accepts valid registration payload with trimmed fields", () => {
    // Arrange & Act
    const result = registerSchema.safeParse({
      ...validPayload,
      name: "  Gilbert Doe  ",
      phone: "+628123456789",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Gilbert Doe");
      expect(result.data.username).toBe("gilbert_123");
      expect(result.data.phone).toBe("+628123456789");
    }
  });

  it("rejects empty or whitespace-only name", () => {
    // Arrange & Act & Assert
    expect(registerSchema.safeParse({ ...validPayload, name: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, name: "   " }).success).toBe(false);
  });

  it("validates username length constraints (3 to 30 characters)", () => {
    // Arrange & Act & Assert
    expect(registerSchema.safeParse({ ...validPayload, username: "ab" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, username: "abc" }).success).toBe(true);
    expect(
      registerSchema.safeParse({ ...validPayload, username: "a".repeat(30) }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...validPayload, username: "a".repeat(31) }).success,
    ).toBe(false);
  });

  it("enforces alphanumeric and underscore regex for username", () => {
    // Arrange & Act & Assert
    expect(
      registerSchema.safeParse({ ...validPayload, username: "user name" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validPayload, username: "user-name" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validPayload, username: "user@name" }).success,
    ).toBe(false);
  });

  it("handles optional phone: trims value, converts empty string to undefined", () => {
    // Arrange & Act
    const emptyRes = registerSchema.safeParse({ ...validPayload, phone: "" });
    const spaceRes = registerSchema.safeParse({ ...validPayload, phone: "   " });
    const omitRes = registerSchema.safeParse(validPayload);

    // Assert
    expect(emptyRes.success && emptyRes.data.phone).toBeUndefined();
    expect(spaceRes.success && spaceRes.data.phone).toBeUndefined();
    expect(omitRes.success && omitRes.data.phone).toBeUndefined();
  });

  it("rejects invalid email and password shorter than 6 characters", () => {
    // Arrange & Act & Assert
    expect(
      registerSchema.safeParse({ ...validPayload, email: "invalid-email" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validPayload, password: "short" }).success,
    ).toBe(false);
  });
});
