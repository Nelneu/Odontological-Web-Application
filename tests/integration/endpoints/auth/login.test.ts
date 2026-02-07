// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "../../../helpers/mockDb";

// Create mock db using vi.hoisted so it's available to vi.mock factories
const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const mock: any = {};
  const chainMethods = [
    "selectFrom",
    "insertInto",
    "updateTable",
    "deleteFrom",
    "innerJoin",
    "leftJoin",
    "select",
    "selectAll",
    "where",
    "returning",
    "returningAll",
    "values",
    "set",
    "orderBy",
    "limit",
    "distinct",
  ];
  for (const method of chainMethods) {
    mock[method] = fn().mockReturnValue(mock);
  }
  mock.execute = fn().mockResolvedValue([]);
  mock.executeTakeFirst = fn().mockResolvedValue(undefined);
  mock.executeTakeFirstOrThrow = fn().mockResolvedValue(undefined);
  mock.transaction = fn().mockReturnValue({
    execute: fn().mockImplementation(async (cb: any) => cb(mock)),
  });
  mock.fn = { countAll: fn().mockReturnValue({ as: fn().mockReturnValue("count") }) };
  mock.dynamic = { ref: fn().mockReturnValue("ref") };
  return mock;
});

vi.mock("../../../../helpers/db", () => ({ db: mockDb }));

vi.mock("../../../../helpers/getSetServerSession", async () => {
  const actual = await vi.importActual("../../../../helpers/getSetServerSession");
  return {
    ...actual,
    setServerSession: vi.fn().mockResolvedValue(undefined),
  };
});

import { handle } from "../../../../endpoints/auth/login_with_password_POST";

function createLoginRequest(body: any) {
  return new Request("http://localhost:3344/_api/auth/login_with_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /auth/login_with_password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid input (missing email)", async () => {
    const request = createLoginRequest({ password: "test" });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid input (missing password)", async () => {
    const request = createLoginRequest({ email: "test@test.com" });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new Request("http://localhost:3344/_api/auth/login_with_password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("handles rate-limited transaction result", async () => {
    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockResolvedValue({
        type: "rate_limited",
        remainingMinutes: 10,
      }),
    });

    const request = createLoginRequest({
      email: "locked@example.com",
      password: "password123",
    });

    const response = await handle(request);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.message).toContain("Too many failed login attempts");
    expect(body.message).toContain("10");
  });

  it("handles auth_failed transaction result", async () => {
    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockResolvedValue({ type: "auth_failed" }),
    });

    const request = createLoginRequest({
      email: "wrong@example.com",
      password: "wrongpass",
    });

    const response = await handle(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toBe("Invalid email or password");
  });

  it("returns user data on successful login", async () => {
    const mockUser = createMockUser({ email: "success@example.com" });
    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockResolvedValue({
        type: "success",
        user: { ...mockUser, passwordHash: "hashed" },
        sessionId: "test-session-id",
        sessionCreatedAt: new Date(),
      }),
    });

    const request = createLoginRequest({
      email: "success@example.com",
      password: "correctpass",
    });

    const response = await handle(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("success@example.com");
    expect(body.user.displayName).toBe("Test User");
    // Sensitive data should NOT be in response
    expect(body.user.passwordHash).toBeUndefined();
  });
});
