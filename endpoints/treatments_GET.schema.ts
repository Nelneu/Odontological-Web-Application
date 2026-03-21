import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type TreatmentRecord = {
  id: number;
  patientId: number | null;
  dentistId: number | null;
  appointmentId: number | null;
  treatmentType: string;
  description: string | null;
  toothNumber: string | null;
  status: string | null;
  cost: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  patientName: string | null;
  dentistName: string | null;
};

export type OutputType = {
  treatments: TreatmentRecord[];
};

export const getTreatments = async (
  params?: { patientId?: number },
  init?: RequestInit,
): Promise<OutputType> => {
  const url = new URL("/_api/treatments", window.location.origin);
  if (params?.patientId) {
    url.searchParams.set("patientId", params.patientId.toString());
  }

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch treatments");
  }
  return superjson.parse<OutputType>(await result.text());
};
