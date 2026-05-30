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
    const { treatmentId } = schema.parse(json);

    const existing = await db
      .selectFrom("treatments")
      .select("id")
      .where("id", "=", treatmentId)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Tratamiento no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.deleteFrom("treatments").where("id", "=", treatmentId).execute();

    return new Response(superjson.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting treatment:", error);
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
