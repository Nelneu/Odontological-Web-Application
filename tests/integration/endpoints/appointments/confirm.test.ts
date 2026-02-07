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

import { handle } from "../../../../endpoints/appointments/confirm_POST";

function createConfirmRequest(body: any) {
  return new Request("http://localhost:3344/_api/appointments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(body),
  });
}

describe("POST /appointments/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when appointment not found", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const response = await handle(createConfirmRequest({ id: 999 }));
    expect(response.status).toBe(404);
  });

  it("returns 403 when patient tries to confirm", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 2, role: "patient" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ patientId: 2, status: "programada" }),
    );

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(403);
    const body = superjson.parse<any>(await response.text());
    expect(body.error).toContain("permission");
  });

  it("returns 403 when dentist tries to confirm another's appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 3, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ dentistId: 7, status: "programada" }),
    );

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when appointment is not 'programada'", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ dentistId: 1, status: "completada" }),
    );

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(400);
    const body = superjson.parse<any>(await response.text());
    expect(body.error).toContain("completada");
  });

  it("allows dentist to confirm their own programada appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });
    const appointment = createMockAppointment({ dentistId: 1, status: "programada" });
    mockDb.executeTakeFirst.mockResolvedValueOnce(appointment);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ ...appointment, status: "confirmada" });

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.appointment.status).toBe("confirmada");
  });

  it("allows admin to confirm any appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "admin" }),
      session: {},
    });
    const appointment = createMockAppointment({ dentistId: 5, status: "programada" });
    mockDb.executeTakeFirst.mockResolvedValueOnce(appointment);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ ...appointment, status: "confirmada" });

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(200);
  });

  it("cannot confirm cancelada appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ dentistId: 1, status: "cancelada" }),
    );

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(400);
  });

  it("cannot confirm ausente appointment", async () => {
    mockGetServerUserSession.mockResolvedValue({
      user: createMockUser({ id: 1, role: "dentist" }),
      session: {},
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(
      createMockAppointment({ dentistId: 1, status: "ausente" }),
    );

    const response = await handle(createConfirmRequest({ id: 1 }));
    expect(response.status).toBe(400);
  });
});
