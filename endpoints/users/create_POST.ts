import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./create_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
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
    const { email, password, displayName, role } = schema.parse(json);

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email.toLowerCase())
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      return new Response(superjson.stringify({ error: "El email ya está en uso" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = await generatePasswordHash(password);

    const newUser = await db.transaction().execute(async (trx) => {
      const [created] = await trx
        .insertInto("users")
        .values({
          email: email.toLowerCase(),
          displayName,
          role,
        })
        .returning(["id", "email", "displayName", "role"])
        .execute();

      await trx
        .insertInto("userPasswords")
        .values({
          userId: created.id,
          passwordHash,
        })
        .execute();

      // If creating a patient, also create a patients record
      if (role === "patient") {
        await trx
          .insertInto("patients")
          .values({
            userId: created.id,
          })
          .execute();
      }

      return created;
    });

    return new Response(superjson.stringify({ user: newUser }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating user:", error);
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
