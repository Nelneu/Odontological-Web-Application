import { db } from '../helpers/db';
import { OutputType } from "./dentists_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    // For now, we return all dentists. In the future, this could be extended
    // to include availability, specific skills, etc.
    const dentists = await db
      .selectFrom('users')
      .select(['id', 'displayName', 'avatarUrl'])
      .where('role', '=', 'dentist')
      .orderBy('displayName', 'asc')
      .execute();

    return new Response(superjson.stringify({ dentists } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error fetching dentists:", error);
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), { status: 500 });
  }
}