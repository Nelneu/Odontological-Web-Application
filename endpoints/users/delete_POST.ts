import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./delete_POST.schema";
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
    const { userId } = schema.parse(json);

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        superjson.stringify({ error: "No puede eliminar su propia cuenta de administrador" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check user exists
    const existingUser = await db
      .selectFrom("users")
      .select(["id", "role"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!existingUser) {
      return new Response(superjson.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete user (cascading will handle passwords and sessions)
    await db.deleteFrom("users").where("id", "=", userId).execute();

    return new Response(superjson.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
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
