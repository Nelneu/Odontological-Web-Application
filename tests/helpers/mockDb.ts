import { vi } from "vitest";

/**
 * Creates a chainable mock that simulates Kysely's query builder pattern.
 * IMPORTANT: This should only be called inside vi.hoisted() or at module level
 * in test files when not used inside vi.mock factories.
 */
export function createChainableMock() {
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
    mock[method] = vi.fn().mockReturnValue(mock);
  }

  // Terminal methods
  mock.execute = vi.fn().mockResolvedValue([]);
  mock.executeTakeFirst = vi.fn().mockResolvedValue(undefined);
  mock.executeTakeFirstOrThrow = vi.fn().mockResolvedValue(undefined);

  // For fn.countAll, fn.count, fn.max, etc.
  mock.fn = {
    countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue("count") }),
    count: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue("count") }),
    max: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue("max") }),
  };

  // For dynamic refs
  mock.dynamic = {
    ref: vi.fn().mockReturnValue("dynamic_ref"),
  };

  // Transaction support
  mock.transaction = vi.fn().mockReturnValue({
    execute: vi.fn().mockImplementation(async (fn: any) => fn(mock)),
  });

  return mock;
}

/**
 * Creates a chainable mock inline for use in vi.hoisted().
 * Does not depend on any external imports.
 */
export function createHoistedMock(viFn: typeof vi.fn) {
  const mock: any = {};
  const chainMethods = [
    "selectFrom", "insertInto", "updateTable", "deleteFrom",
    "innerJoin", "leftJoin", "select", "selectAll",
    "where", "returning", "returningAll", "values",
    "set", "orderBy", "limit", "distinct",
  ];

  for (const method of chainMethods) {
    mock[method] = viFn().mockReturnValue(mock);
  }

  mock.execute = viFn().mockResolvedValue([]);
  mock.executeTakeFirst = viFn().mockResolvedValue(undefined);
  mock.executeTakeFirstOrThrow = viFn().mockResolvedValue(undefined);

  mock.fn = {
    countAll: viFn().mockReturnValue({ as: viFn().mockReturnValue("count") }),
    count: viFn().mockReturnValue({ as: viFn().mockReturnValue("count") }),
    max: viFn().mockReturnValue({ as: viFn().mockReturnValue("max") }),
  };

  mock.dynamic = {
    ref: viFn().mockReturnValue("dynamic_ref"),
  };

  mock.transaction = viFn().mockReturnValue({
    execute: viFn().mockImplementation(async (fn: any) => fn(mock)),
  });

  return mock;
}

/**
 * Creates a mock User object
 */
export function createMockUser(overrides: Partial<{
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "admin" | "dentist" | "patient" | "user";
}> = {}) {
  return {
    id: 1,
    email: "test@example.com",
    displayName: "Test User",
    avatarUrl: null,
    role: "dentist" as const,
    ...overrides,
  };
}

/**
 * Creates a mock appointment object
 */
export function createMockAppointment(overrides: Partial<any> = {}) {
  return {
    id: 1,
    patientId: 2,
    dentistId: 1,
    appointmentDate: new Date("2025-06-15T10:00:00.000Z"),
    durationMinutes: 30,
    status: "programada" as const,
    reason: "Limpieza dental",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock patient object
 */
export function createMockPatient(overrides: Partial<any> = {}) {
  return {
    id: 1,
    userId: 2,
    address: "Av. Corrientes 1234",
    phone: "+54 11 1234-5678",
    birthDate: new Date("1990-01-01"),
    allergies: null,
    medicalHistory: null,
    emergencyContactName: "María García",
    emergencyContactPhone: "+54 11 9876-5432",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
