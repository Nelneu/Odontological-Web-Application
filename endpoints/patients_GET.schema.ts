import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Patients, Users } from "../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type PatientRecord = Selectable<Patients> &
  Pick<Selectable<Users>, "displayName" | "email" | "avatarUrl">;

export type OutputType = {
  patients: PatientRecord[];
};

export const getPatients = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/patients`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch patients");
  }
  return superjson.parse<OutputType>(await result.text());
};
