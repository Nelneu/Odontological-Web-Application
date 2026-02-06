import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";
import { Selectable } from "kysely";
import { Patients } from "../../helpers/schema";

export const schema = z.object({
  // User data
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Full name is required"),
  // Patient data
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  birthDate: z.coerce.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date of birth",
  }),
  allergies: z.string().nullable().optional().default(null),
  medicalHistory: z.string().nullable().optional().default(null),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
  patient: Selectable<Patients>;
};

export const postRegisterPatient = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/patients/register`, {
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
    throw new Error((errorObject as any)?.error || "Patient registration failed");
  }
  return superjson.parse<OutputType>(await result.text());
};