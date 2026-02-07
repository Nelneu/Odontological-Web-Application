import { describe, it, expect } from "vitest";
import {
  appointmentStatusValues,
  AppointmentStatusSchema,
} from "../../../helpers/appointmentTypes";

describe("appointmentStatusValues", () => {
  it("contains all 5 status values", () => {
    expect(appointmentStatusValues).toHaveLength(5);
  });

  it("contains the expected Spanish status values", () => {
    expect(appointmentStatusValues).toContain("programada");
    expect(appointmentStatusValues).toContain("confirmada");
    expect(appointmentStatusValues).toContain("completada");
    expect(appointmentStatusValues).toContain("cancelada");
    expect(appointmentStatusValues).toContain("ausente");
  });

  it("is readonly (frozen tuple)", () => {
    // TypeScript enforces this at compile time, but we verify the values are stable
    expect(appointmentStatusValues[0]).toBe("programada");
    expect(appointmentStatusValues[4]).toBe("ausente");
  });
});

describe("AppointmentStatusSchema", () => {
  it("validates all status values", () => {
    for (const status of appointmentStatusValues) {
      const result = AppointmentStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status values", () => {
    const invalidStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "no-show",
      "",
      "PROGRAMADA",
      "Confirmada",
    ];

    for (const status of invalidStatuses) {
      const result = AppointmentStatusSchema.safeParse(status);
      expect(result.success).toBe(false);
    }
  });

  it("rejects non-string values", () => {
    expect(AppointmentStatusSchema.safeParse(1).success).toBe(false);
    expect(AppointmentStatusSchema.safeParse(null).success).toBe(false);
    expect(AppointmentStatusSchema.safeParse(undefined).success).toBe(false);
  });
});
