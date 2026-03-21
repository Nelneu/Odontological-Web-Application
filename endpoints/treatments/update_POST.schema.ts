import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  treatmentId: z.number().int().positive(),
  treatmentType: z.string().min(1).optional(),
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
    status: string | null;
  };
};

export const updateTreatment = async (
  data: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const result = await fetch(`/_api/treatments/update`, {
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
    throw new Error((errorObject as any)?.error || "Failed to update treatment");
  }
  return superjson.parse<OutputType>(await result.text());
};
