import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Appointments } from "../../helpers/schema";

export const schema = z.object({
  id: z.number().int(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  appointment: Selectable<Appointments>;
};

export const postAppointmentsConfirm = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/appointments/confirm`, {
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
    throw new Error((errorObject as any)?.error || "Failed to confirm appointment");
  }
  return superjson.parse<OutputType>(await result.text());
};