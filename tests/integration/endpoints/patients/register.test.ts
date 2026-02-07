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
vi.mock("../../../../helpers/getSetServerSession", () => ({
  setServerSession: vi.fn().mockResolvedValue(undefined),
  SessionExpirationSeconds: 604800,
}));

import { handle } from "../../../../endpoints/patients/register_POST";

const validPatientData = {
  email: "paciente@example.com",
  password: "password123",
  displayName: "Juan Pérez",
  address: "Av. 9 de Julio 1234",
  phone: "+54 11 1234-5678",
  birthDate: "1985-03-20",
  emergencyContactName: "Ana Pérez",
  emergencyContactPhone: "+54 11 9876-5432",
};

function createRegisterRequest(body: any) {
  return new Request("http://localhost:3344/_api/patients/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /patients/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing required fields", async () => {
    const response = await handle(createRegisterRequest({
      email: "test@test.com",
      password: "password123",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const response = await handle(createRegisterRequest({
      ...validPatientData,
      password: "short",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 1 });

    const response = await handle(createRegisterRequest(validPatientData));
    expect(response.status).toBe(409);
    const body = superjson.parse<any>(await response.text());
    expect(body.error).toContain("email already exists");
  });

  it("creates patient with role 'patient'", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined); // no existing user

    const newUser = {
      id: 5, email: "paciente@example.com", displayName: "Juan Pérez",
      avatarUrl: null, role: "patient", createdAt: new Date(), updatedAt: new Date(),
    };
    const newPatient = {
      id: 1, userId: 5, address: "Av. 9 de Julio 1234",
      phone: "+54 11 1234-5678", birthDate: new Date("1985-03-20"),
      allergies: null, medicalHistory: null,
      emergencyContactName: "Ana Pérez", emergencyContactPhone: "+54 11 9876-5432",
      createdAt: new Date(), updatedAt: new Date(),
    };

    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockResolvedValue({ user: newUser, patient: newPatient }),
    });
    mockDb.execute.mockResolvedValueOnce([]); // session insert

    const response = await handle(createRegisterRequest(validPatientData));
    expect(response.status).toBe(200);
    const body = superjson.parse<any>(await response.text());
    expect(body.user.role).toBe("patient");
    expect(body.patient).toBeDefined();
  });

  it("validates email format", async () => {
    const response = await handle(createRegisterRequest({
      ...validPatientData,
      email: "not-an-email",
    }));
    expect(response.status).toBe(400);
  });

  it("validates all required patient fields", async () => {
    const requiredFields = ["address", "phone", "birthDate", "emergencyContactName", "emergencyContactPhone"];
    for (const field of requiredFields) {
      const data = { ...validPatientData };
      delete (data as any)[field];
      const response = await handle(createRegisterRequest(data));
      expect(response.status).toBe(400);
    }
  });
});
