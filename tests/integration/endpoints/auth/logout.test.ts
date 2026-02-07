// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const mock: any = {};
  const methods = [
    "selectFrom", "insertInto", "updateTable", "deleteFrom",
    "innerJoin", "select", "selectAll", "where",
    "returning", "returningAll", "values", "set",
    "orderBy", "limit",
  ];
  for (const method of methods) {
    mock[method] = fn().mockReturnValue(mock);
  }
  mock.execute = fn().mockResolvedValue([]);
  mock.executeTakeFirst = fn().mockResolvedValue(undefined);
  return mock;
});

const mockGetServerSessionOrThrow = vi.hoisted(() => vi.fn());
const mockClearServerSession = vi.hoisted(() => vi.fn());

vi.mock("../../../../helpers/db", () => ({ db: mockDb }));
vi.mock("../../../../helpers/getSetServerSession", () => ({
  getServerSessionOrThrow: mockGetServerSessionOrThrow,
  clearServerSession: mockClearServerSession,
  NotAuthenticatedError: class NotAuthenticatedError extends Error {
    constructor(msg?: string) {
      super(msg ?? "Not authenticated");
      this.name = "NotAuthenticatedError";
    }
  },
}));

import { handle } from "../../../../endpoints/auth/logout_POST";

describe("POST /auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    const { NotAuthenticatedError } = await import("../../../../helpers/getSetServerSession");
    mockGetServerSessionOrThrow.mockRejectedValue(new NotAuthenticatedError());

    const request = new Request("http://localhost:3344/_api/auth/logout", {
      method: "POST",
    });

    const response = await handle(request);
    expect(response.status).toBe(401);
  });

  it("deletes session and clears cookie on success", async () => {
    mockGetServerSessionOrThrow.mockResolvedValue({
      id: "session-to-delete",
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });

    const request = new Request("http://localhost:3344/_api/auth/logout", {
      method: "POST",
    });

    const response = await handle(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Logged out successfully");
    expect(mockClearServerSession).toHaveBeenCalled();
  });
});
