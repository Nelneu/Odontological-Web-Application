import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Appointments } from "../helpers/schema";

export const schema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type InputType = z.infer<typeof schema>;

export type Appointment = Pick<
  Selectable<Appointments>,
  "id" | "appointmentDate" | "durationMinutes" | "status" | "reason" | "notes"
> & {
  patient: {
    id: number;
    displayName: string;
  };
  dentist: {
    id: number;
    displayName: string;
  };
};

export type OutputType = {
  appointments: Appointment[];
};

export const getAppointments = async (
  params?: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.set("startDate", params.startDate);
  if (params?.endDate) queryParams.set("endDate", params.endDate);

  const result = await fetch(`/_api/appointments?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch appointments");
  }
  return superjson.parse<OutputType>(await result.text());
};
