import { z } from "zod";

/**
 * Defines the possible statuses for an appointment.
 * Using Spanish terms to align with the project's target audience.
 * - programada: Scheduled by the patient or dentist.
 * - confirmada: Confirmed by the patient.
 * - completada: The appointment has concluded.
 * - cancelada: The appointment was cancelled.
 * - ausente: The patient did not show up for the appointment.
 */
export const appointmentStatusValues = [
  "programada",
  "confirmada",
  "completada",
  "cancelada",
  "ausente",
] as const;

export type AppointmentStatus = (typeof appointmentStatusValues)[number];

export const AppointmentStatusSchema = z.enum(appointmentStatusValues);
