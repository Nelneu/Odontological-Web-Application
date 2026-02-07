import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Patients, Users } from "../../helpers/schema";

// Input schema for the GET request query parameters
export const schema = z.object({
  patientId: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

// Combined type for the patient profile
export type PatientProfile = Selectable<Patients> &
  Pick<Selectable<Users>, "email" | "displayName" | "avatarUrl" | "role">;

export type OutputType = PatientProfile;

export const getPatientProfile = async (
  params: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const query = new URLSearchParams();
  if (params.patientId) {
    query.set("patientId", params.patientId.toString());
  }

  const result = await fetch(`/_api/patients/profile?${query.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch patient profile");
  }
  return superjson.parse<OutputType>(await result.text());
};
