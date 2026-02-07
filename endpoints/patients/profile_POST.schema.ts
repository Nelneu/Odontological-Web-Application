import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Patients } from "../../helpers/schema";

export const schema = z.object({
  patientId: z.number().int().positive().optional(), // Required for admin, ignored for patient
  address: z.string().min(1, "Address is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  birthDate: z.coerce.date().optional(),
  allergies: z.string().nullable().optional(),
  medicalHistory: z.string().nullable().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required").optional(),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required").optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  patient: Selectable<Patients>;
};

export const postPatientProfile = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/patients/profile`, {
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
    throw new Error((errorObject as any)?.error || "Failed to update patient profile");
  }
  return superjson.parse<OutputType>(await result.text());
};
