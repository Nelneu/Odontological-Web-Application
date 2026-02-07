import { z } from "zod";
import superjson from "superjson";
import { UserRole } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType =
  | {
      role: "dentist";
      appointmentsToday: number;
      totalPatients: number;
      upcomingAppointments: number;
    }
  | {
      role: "patient";
      nextAppointmentDate: Date | null;
      treatmentsCount: number;
    }
  | {
      role: Exclude<UserRole, "dentist" | "patient">;
    };

export const getDashboardStats = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/dashboard/stats`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch dashboard stats");
  }
  return superjson.parse<OutputType>(await result.text());
};
