import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Appointments } from "../helpers/schema";
import { AppointmentStatusSchema } from "../helpers/appointmentTypes";

export const schema = z.object({
  appointmentDate: z.string().datetime({ message: "Invalid date format" }),
  durationMinutes: z.number().int().positive({ message: "Duration must be a positive number" }),
  reason: z.string().min(1, { message: "Reason is required" }).optional(),
  notes: z.string().optional(),
  dentistId: z.number().int(),
  patientId: z.number().int().optional(), // Optional for patients booking for themselves
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  appointment: Selectable<Appointments>;
};

export const postAppointments = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/appointments`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to create appointment");
  }
  return superjson.parse<OutputType>(await result.text());
};
