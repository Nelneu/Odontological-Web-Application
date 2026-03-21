import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./update_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(superjson.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const json = await request.json();
    const { userId, displayName, role } = schema.parse(json);

    // Prevent admin from changing their own role
    if (userId === user.id && role && role !== "admin") {
      return new Response(
        superjson.stringify({ error: "No puede cambiar su propio rol de administrador" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check user exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!existingUser) {
      return new Response(superjson.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (displayName !== undefined) updateValues.displayName = displayName;
    if (role !== undefined) updateValues.role = role;

    const [updated] = await db
      .updateTable("users")
      .set(updateValues)
      .where("id", "=", userId)
      .returning(["id", "email", "displayName", "role"])
      .execute();

    return new Response(superjson.stringify({ user: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), {
      status: 500,
    });
  }
}
