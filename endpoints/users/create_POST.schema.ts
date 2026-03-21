import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues } from "../../helpers/schema";

export const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  displayName: z.string().min(1, "El nombre es requerido"),
  role: z.enum(UserRoleArrayValues),
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

export const createUser = async (data: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/users/create`, {
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
    throw new Error((errorObject as any)?.error || "Failed to create user");
  }
  return superjson.parse<OutputType>(await result.text());
};
