import { describe, it, expect } from "vitest";
import { schema as loginSchema } from "../../../endpoints/auth/login_with_password_POST.schema";
import { schema as registerSchema } from "../../../endpoints/auth/register_with_password_POST.schema";
import { schema as logoutSchema } from "../../../endpoints/auth/logout_POST.schema";
import { schema as sessionSchema } from "../../../endpoints/auth/session_GET.schema";

describe("Login Schema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.password).toBe("password123");
    }
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: "test@example.com" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "123" }).success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = loginSchema.safeParse({
      email: 123,
      password: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("Register Schema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "newuser@example.com",
      password: "securepass123",
      displayName: "John Doe",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("newuser@example.com");
      expect(result.data.displayName).toBe("John Doe");
    }
  });

  it("enforces minimum password length of 8 characters", () => {
    const short = registerSchema.safeParse({
      email: "test@example.com",
      password: "1234567",
      displayName: "Test",
    });
    expect(short.success).toBe(false);

    const exact = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
      displayName: "Test",
    });
    expect(exact.success).toBe(true);
  });

  it("requires non-empty displayName", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "securepass123",
      displayName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "bad-email",
      password: "securepass123",
      displayName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields gracefully (strips them)", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "securepass123",
      displayName: "Test",
      extraField: "should be ignored",
    });
    expect(result.success).toBe(true);
  });
});

describe("Logout Schema", () => {
  it("accepts empty object", () => {
    const result = logoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Session Schema", () => {
  it("accepts empty object", () => {
    const result = sessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
