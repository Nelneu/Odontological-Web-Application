import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues } from "../../helpers/schema";

export const schema = z.object({
  userId: z.number().int().positive(),
  displayName: z.string().min(1).optional(),
  role: z.enum(UserRoleArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: {
    id: number;
    email: string;
    displayName: string;
    role: string;
  };
};

export const updateUser = async (data: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/users/update`, {
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
    throw new Error((errorObject as any)?.error || "Failed to update user");
  }
  return superjson.parse<OutputType>(await result.text());
};
