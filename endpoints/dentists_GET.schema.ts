import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Users } from "../helpers/schema";

// No input schema needed for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type Dentist = Pick<Selectable<Users>, "id" | "displayName" | "avatarUrl">;

export type OutputType = {
  dentists: Dentist[];
};

export const getDentists = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/dentists`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch dentists");
  }
  return superjson.parse<OutputType>(await result.text());
};
