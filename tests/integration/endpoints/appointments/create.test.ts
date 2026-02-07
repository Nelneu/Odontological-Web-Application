// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "../../../helpers/mockDb";
import superjson from "superjson";

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const mock: any = {};
  const methods = [
    "selectFrom",
    "insertInto",
    "updateTable",
    "deleteFrom",
    "innerJoin",
    "select",
    "selectAll",
    "where",
    "returning",
    "returningAll",
    "values",
    "set",
    "orderBy",
    "limit",
  ];
  for (const method of methods) {
    mock[method] = fn().mockReturnValue(mock);
  }
  mock.execute = fn().mockResolvedValue([]);
  mock.executeTakeFirst = fn().mockResolvedValue(undefined);
  mock.executeTakeFirstOrThrow = fn().mockResolvedValue(undefined);
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

import { handle } from "../../../../endpoints/appointments_POST";

function createPostRequest(body: any) {
  return new Request("http://localhost:3344/_api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(body),
  });
}

describe("POST /appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { NotAuthenticatedError } = await import("../../../../helpers/getSetServerSession");
    mockGetServerUserSession.mockRejectedValue(new NotAuthenticatedError());

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 1,
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when 'user' role tries to create", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ role: "user" }),
      session: {},
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 1,
        patientId: 2,
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 when patient books for another patient", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 5, role: "patient" }),
      session: {},
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 1,
        patientId: 10,
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 when dentist books on another dentist's schedule", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 3, role: "dentist" }),
      session: {},
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 7,
        patientId: 2,
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when dentist doesn't specify patientId", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 1,
      }),
    );
    expect(response.status).toBe(400);
  });

  it("creates appointment for admin successfully", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "admin" }),
      session: {},
    });

    // No conflicts
    mockDb.execute.mockResolvedValueOnce([]);
    // New appointment
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({
      id: 1,
      appointmentDate: new Date("2025-06-15T10:00:00.000Z"),
      durationMinutes: 30,
      dentistId: 2,
      patientId: 3,
      status: "programada",
      reason: "Control",
      notes: null,
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 2,
        patientId: 3,
        reason: "Control",
      }),
    );
    expect(response.status).toBe(201);
    const body = superjson.parse<any>(await response.text());
    expect(body.appointment.status).toBe("programada");
  });

  it("returns 409 on time slot conflict", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "admin" }),
      session: {},
    });
    mockDb.execute.mockResolvedValueOnce([{ id: 5 }]); // conflict

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 2,
        patientId: 3,
      }),
    );
    expect(response.status).toBe(409);
    const body = superjson.parse<any>(await response.text());
    expect(body.error).toContain("time slot");
  });

  it("patient auto-sets own patientId", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 5, role: "patient" }),
      session: {},
    });
    mockDb.execute.mockResolvedValueOnce([]); // no conflicts
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({
      id: 1,
      appointmentDate: new Date("2025-06-15T10:00:00.000Z"),
      durationMinutes: 30,
      dentistId: 1,
      patientId: 5,
      status: "programada",
    });

    const response = await handle(
      createPostRequest({
        appointmentDate: "2025-06-15T10:00:00.000Z",
        durationMinutes: 30,
        dentistId: 1,
      }),
    );
    expect(response.status).toBe(201);
  });
});
