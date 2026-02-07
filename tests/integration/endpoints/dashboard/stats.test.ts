// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "../../../helpers/mockDb";
import superjson from "superjson";

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const mock: any = {};
  const methods = [
    "selectFrom", "insertInto", "updateTable", "deleteFrom",
    "innerJoin", "select", "selectAll", "where",
    "returning", "returningAll", "values", "set",
    "orderBy", "limit", "distinct",
  ];
  for (const method of methods) {
    mock[method] = fn().mockReturnValue(mock);
  }
  mock.execute = fn().mockResolvedValue([]);
  mock.executeTakeFirst = fn().mockResolvedValue(undefined);
  mock.executeTakeFirstOrThrow = fn().mockResolvedValue(undefined);
  // eb helper for count queries
  mock.fn = {
    count: fn().mockReturnValue({ as: fn().mockReturnValue("count") }),
  };
  return mock;
});

const mockGetServerUserSession = vi.hoisted(() => vi.fn());

vi.mock("../../../../helpers/db", () => ({ db: mockDb }));
vi.mock("../../../../helpers/getServerUserSession", () => ({
  getServerUserSession: mockGetServerUserSession,
}));
vi.mock("../../../../helpers/getSetServerSession", () => ({
  NotAuthenticatedError: class NotAuthenticatedError extends Error {
    constructor(msg?: string) {
      super(msg ?? "Not authenticated");
      this.name = "NotAuthenticatedError";
    }
  },
}));

import { handle } from "../../../../endpoints/dashboard/stats_GET";

function createStatsRequest() {
  return new Request("http://localhost:3344/_api/dashboard/stats", { method: "GET" });
}

describe("GET /dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { NotAuthenticatedError } = await import("../../../../helpers/getSetServerSession");
    mockGetServerUserSession.mockRejectedValue(new NotAuthenticatedError());

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(401);
  });

  it("returns dentist stats", async () => {
    mockGetServerUserSession.mockResolvedValue({ user: createMockUser({ id: 1, role: "dentist" }), session: {} });
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ count: "5" })
      .mockResolvedValueOnce({ count: "12" })
      .mockResolvedValueOnce({ count: "8" });

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.role).toBe("dentist");
    expect(body.appointmentsToday).toBe(5);
    expect(body.totalPatients).toBe(12);
    expect(body.upcomingAppointments).toBe(8);
  });

  it("returns patient stats", async () => {
    mockGetServerUserSession.mockResolvedValue({ user: createMockUser({ id: 2, role: "patient" }), session: {} });
    mockDb.executeTakeFirst.mockResolvedValueOnce({ appointmentDate: new Date("2025-07-01T14:00:00.000Z") });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: "3" });

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.role).toBe("patient");
    expect(body.nextAppointmentDate).toBeDefined();
    expect(body.treatmentsCount).toBe(3);
  });

  it("returns patient stats with null when no upcoming appointments", async () => {
    mockGetServerUserSession.mockResolvedValue({ user: createMockUser({ id: 2, role: "patient" }), session: {} });
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: "0" });

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.nextAppointmentDate).toBeNull();
    expect(body.treatmentsCount).toBe(0);
  });

  it("returns generic stats for admin", async () => {
    mockGetServerUserSession.mockResolvedValue({ user: createMockUser({ id: 1, role: "admin" }), session: {} });

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.role).toBe("admin");
  });

  it("returns generic stats for 'user' role", async () => {
    mockGetServerUserSession.mockResolvedValue({ user: createMockUser({ id: 1, role: "user" }), session: {} });

    const response = await handle(createStatsRequest());
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.role).toBe("user");
  });
});
