import { describe, it, expect } from "vitest";
import { schema as getSchema } from "../../../endpoints/appointments_GET.schema";
import { schema as postSchema } from "../../../endpoints/appointments_POST.schema";
import { schema as cancelSchema } from "../../../endpoints/appointments/cancel_POST.schema";
import { schema as confirmSchema } from "../../../endpoints/appointments/confirm_POST.schema";
import { schema as updateSchema } from "../../../endpoints/appointments/update_POST.schema";

describe("Appointments GET Schema", () => {
  it("accepts empty object (no filters)", () => {
    const result = getSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid ISO datetime strings", () => {
    const result = getSchema.safeParse({
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts only startDate", () => {
    const result = getSchema.safeParse({
      startDate: "2025-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts only endDate", () => {
    const result = getSchema.safeParse({
      endDate: "2025-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = getSchema.safeParse({
      startDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null values as missing (from URLSearchParams)", () => {
    const result = getSchema.safeParse({
      startDate: null,
      endDate: null,
    });
    // null gets coerced/rejected based on schema - optional fields
    // In the endpoint, null from searchParams.get() is handled before parse
    expect(result.success).toBe(false);
  });
});

describe("Appointments POST Schema", () => {
  const validAppointment = {
    appointmentDate: "2025-06-15T10:00:00.000Z",
    durationMinutes: 30,
    dentistId: 1,
  };

  it("accepts valid appointment with required fields only", () => {
    const result = postSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it("accepts full appointment with all fields", () => {
    const result = postSchema.safeParse({
      ...validAppointment,
      reason: "Limpieza dental",
      notes: "Paciente con sensibilidad",
      patientId: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive duration", () => {
    expect(postSchema.safeParse({ ...validAppointment, durationMinutes: 0 }).success).toBe(false);
    expect(postSchema.safeParse({ ...validAppointment, durationMinutes: -30 }).success).toBe(false);
  });

  it("rejects non-integer duration", () => {
    const result = postSchema.safeParse({
      ...validAppointment,
      durationMinutes: 30.5,
    });
    expect(result.success).toBe(false);
  });

  it("requires dentistId", () => {
    const { dentistId, ...withoutDentist } = validAppointment;
    const result = postSchema.safeParse(withoutDentist);
    expect(result.success).toBe(false);
  });

  it("requires appointmentDate", () => {
    const { appointmentDate, ...withoutDate } = validAppointment;
    const result = postSchema.safeParse(withoutDate);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = postSchema.safeParse({
      ...validAppointment,
      appointmentDate: "tomorrow",
    });
    expect(result.success).toBe(false);
  });

  it("patientId is optional", () => {
    const result = postSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patientId).toBeUndefined();
    }
  });
});

describe("Appointments Cancel Schema", () => {
  it("accepts valid appointment id", () => {
    const result = cancelSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = cancelSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-integer id", () => {
    expect(cancelSchema.safeParse({ id: 1.5 }).success).toBe(false);
    expect(cancelSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
});

describe("Appointments Confirm Schema", () => {
  it("accepts valid appointment id", () => {
    const result = confirmSchema.safeParse({ id: 42 });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    expect(confirmSchema.safeParse({}).success).toBe(false);
  });
});

describe("Appointments Update Schema", () => {
  it("accepts id with no update fields", () => {
    const result = updateSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = updateSchema.safeParse({
      id: 1,
      reason: "Updated reason",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all update fields", () => {
    const result = updateSchema.safeParse({
      id: 1,
      appointmentDate: "2025-07-01T14:00:00.000Z",
      durationMinutes: 60,
      reason: "Control",
      notes: "Follow-up",
      status: "confirmada",
    });
    expect(result.success).toBe(true);
  });

  it("validates status enum values", () => {
    expect(updateSchema.safeParse({ id: 1, status: "programada" }).success).toBe(true);
    expect(updateSchema.safeParse({ id: 1, status: "confirmada" }).success).toBe(true);
    expect(updateSchema.safeParse({ id: 1, status: "completada" }).success).toBe(true);
    expect(updateSchema.safeParse({ id: 1, status: "cancelada" }).success).toBe(true);
    expect(updateSchema.safeParse({ id: 1, status: "ausente" }).success).toBe(true);
  });

  it("rejects invalid status values", () => {
    expect(updateSchema.safeParse({ id: 1, status: "invalid" }).success).toBe(false);
    expect(updateSchema.safeParse({ id: 1, status: "pending" }).success).toBe(false);
  });

  it("requires id", () => {
    const result = updateSchema.safeParse({ reason: "test" });
    expect(result.success).toBe(false);
  });
});
