import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Appointments } from "../../helpers/schema";
import { AppointmentStatusSchema } from "../../helpers/appointmentTypes";

export const schema = z.object({
  id: z.number().int(),
  appointmentDate: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  reason: z.string().min(1).optional(),
  notes: z.string().optional(),
  status: AppointmentStatusSchema.optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  appointment: Selectable<Appointments>;
};

export const postAppointmentsUpdate = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/appointments/update`, {
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
    throw new Error((errorObject as any)?.error || "Failed to update appointment");
  }
  return superjson.parse<OutputType>(await result.text());
};
