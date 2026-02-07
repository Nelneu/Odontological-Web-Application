// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser, createMockAppointment } from "../../../helpers/mockDb";
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

import { handle } from "../../../../endpoints/appointments/cancel_POST";

function createCancelRequest(body: any) {
  return new Request("http://localhost:3344/_api/appointments/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(body),
  });
}

describe("POST /appointments/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { NotAuthenticatedError } = await import("../../../../helpers/getSetServerSession");
    mockGetServerUserSession.mockRejectedValue(new NotAuthenticatedError());

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(401);
  });

  it("returns 404 when appointment not found", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const response = await handle(createCancelRequest({ id: 999 }));
    expect(response.status).toBe(404);
  });

  it("returns 403 when patient tries to cancel someone else's appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 5, role: "patient" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(createMockAppointment({ patientId: 10 }));

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(403);
    const body = superjson.parse<any>(await response.text());
    expect(body.error).toContain("your own");
  });

  it("returns 403 when dentist tries to cancel another dentist's appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 3, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(createMockAppointment({ dentistId: 7 }));

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(403);
  });

  it("allows patient to cancel own appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 2, role: "patient" }),
      session: {},
    });
    const appointment = createMockAppointment({ patientId: 2 });
    mockDb.executeTakeFirst.mockResolvedValueOnce(appointment);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ ...appointment, status: "cancelada" });

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.appointment.status).toBe("cancelada");
  });

  it("allows admin to cancel any appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "admin" }),
      session: {},
    });
    const appointment = createMockAppointment({ patientId: 5, dentistId: 3 });
    mockDb.executeTakeFirst.mockResolvedValueOnce(appointment);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ ...appointment, status: "cancelada" });

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(200);
  });

  it("returns 200 for already cancelled appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ dentistId: 1, status: "cancelada" }),
    );

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.message).toContain("already cancelled");
  });

  it("returns 403 for 'user' role", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "user" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(createMockAppointment());

    const response = await handle(createCancelRequest({ id: 1 }));
    expect(response.status).toBe(403);
  });
});
