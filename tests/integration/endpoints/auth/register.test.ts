// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  return mock;
});

vi.mock("../../../../helpers/db", () => ({ db: mockDb }));
vi.mock("../../../../helpers/generatePasswordHash", () => ({
  generatePasswordHash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
}));
vi.mock("../../../../helpers/getSetServerSession", async () => {
  const actual = await vi.importActual("../../../../helpers/getSetServerSession");
  return {
    ...actual,
    setServerSession: vi.fn().mockResolvedValue(undefined),
    SessionExpirationSeconds: 604800,
  };
});

import { handle } from "../../../../endpoints/auth/register_with_password_POST";

function createRegisterRequest(body: any) {
  return new Request("http://localhost:3344/_api/auth/register_with_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /auth/register_with_password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing required fields", async () => {
    const request = createRegisterRequest({ email: "test@test.com" });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const request = createRegisterRequest({
      email: "test@test.com",
      password: "short",
      displayName: "Test",
    });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const request = createRegisterRequest({
      email: "not-email",
      password: "password123",
      displayName: "Test",
    });
    const response = await handle(request);
    expect(response.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    mockDb.execute.mockResolvedValueOnce([{ id: 1 }]);

    const request = createRegisterRequest({
      email: "existing@example.com",
      password: "password123",
      displayName: "Test User",
    });

    const response = await handle(request);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.message).toContain("email already in use");
  });

  it("creates user with default role 'user'", async () => {
    // Email doesn't exist
    mockDb.execute.mockResolvedValueOnce([]);

    // Transaction creates user
    const newUser = {
      id: 5,
      email: "new@example.com",
      displayName: "New User",
      createdAt: new Date(),
    };
    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockResolvedValue(newUser),
    });

    // Session insert
    mockDb.execute.mockResolvedValueOnce([]);

    const request = createRegisterRequest({
      email: "new@example.com",
      password: "password123",
      displayName: "New User",
    });

    const response = await handle(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe("user");
  });
});
