import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  userId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

export const deleteUser = async (data: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/users/delete`, {
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
    throw new Error((errorObject as any)?.error || "Failed to delete user");
  }
  return superjson.parse<OutputType>(await result.text());
};
