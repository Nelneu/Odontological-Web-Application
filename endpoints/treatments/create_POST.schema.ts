import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  treatmentType: z.string().min(1, "El tipo de tratamiento es requerido"),
  patientId: z.number().int().positive("Paciente requerido"),
  dentistId: z.number().int().positive("Dentista requerido"),
  appointmentId: z.number().int().positive().optional(),
  description: z.string().optional(),
  toothNumber: z.string().optional(),
  cost: z.number().min(0).optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  treatment: {
    id: number;
    treatmentType: string;
    patientId: number;
    dentistId: number;
  };
};

export const createTreatment = async (data: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/treatments/create`, {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to create treatment");
  }
  return superjson.parse<OutputType>(await result.text());
};
