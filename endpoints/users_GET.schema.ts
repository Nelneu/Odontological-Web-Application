import { z } from "zod";
import superjson from "superjson";
import { UserRole } from "../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type UserRecord = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type OutputType = {
  users: UserRecord[];
};

export const getUsers = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/users`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any)?.error || "Failed to fetch users");
  }
  return superjson.parse<OutputType>(await result.text());
};
