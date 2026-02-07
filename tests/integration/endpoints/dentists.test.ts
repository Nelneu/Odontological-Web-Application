// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import superjson from "superjson";

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

vi.mock("../../../helpers/db", () => ({ db: mockDb }));

import { handle } from "../../../endpoints/dentists_GET";

function createRequest() {
  return new Request("http://localhost:3344/_api/dentists", { method: "GET" });
}

describe("GET /dentists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of dentists", async () => {
    mockDb.execute.mockResolvedValueOnce([
      { id: 1, displayName: "Dr. García", avatarUrl: null },
      { id: 2, displayName: "Dr. López", avatarUrl: "https://example.com/avatar.jpg" },
    ]);

    const response = await handle(createRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.dentists).toHaveLength(2);
    expect(body.dentists[0].displayName).toBe("Dr. García");
  });

  it("returns empty list when no dentists", async () => {
    mockDb.execute.mockResolvedValueOnce([]);

    const response = await handle(createRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.dentists).toHaveLength(0);
  });

  it("does not require authentication", async () => {
    mockDb.execute.mockResolvedValueOnce([]);
    const response = await handle(createRequest());
    expect(response.status).toBe(200);
  });

  it("returns 500 on database error", async () => {
    mockDb.execute.mockRejectedValueOnce(new Error("DB connection failed"));
    const response = await handle(createRequest());
    expect(response.status).toBe(500);
  });
});
