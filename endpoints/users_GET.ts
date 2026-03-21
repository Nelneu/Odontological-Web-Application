import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { OutputType } from "./users_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(superjson.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const users = await db
      .selectFrom("users")
      .select(["id", "email", "displayName", "avatarUrl", "role", "createdAt", "updatedAt"])
      .orderBy("createdAt", "desc")
      .execute();

    const response: OutputType = { users };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
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
