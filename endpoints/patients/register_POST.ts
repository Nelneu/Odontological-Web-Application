import { db } from "../../helpers/db";
import { schema, OutputType } from "./register_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { setServerSession, SessionExpirationSeconds } from "../../helpers/getSetServerSession";
import { randomBytes } from "crypto";
import superjson from "superjson";
import { z } from "zod";
import { User } from "../../helpers/User";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password, displayName, ...patientData } = schema.parse(json);

    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      return new Response(
        superjson.stringify({ error: "An account with this email already exists." }),
        { status: 409 }
      );
    }

    const passwordHash = await generatePasswordHash(password);

    const { user, patient } = await db.transaction().execute(async (trx) => {
      const [newUser] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          role: "patient",
        })
        .returningAll()
        .execute();

      await trx
        .insertInto("userPasswords")
        .values({
          userId: newUser.id,
          passwordHash,
        })
        .execute();

      const [newPatient] = await trx
        .insertInto("patients")
        .values({
          userId: newUser.id,
          ...patientData,
        })
        .returningAll()
        .execute();

      return { user: newUser, patient: newPatient };
    });

    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: user.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    const responseUser: User = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: 'patient'
    };

    const response = new Response(
      superjson.stringify({ user: responseUser, patient } satisfies OutputType)
    );

    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error) {
    console.error("Patient registration error:", error);
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data", details: error.errors }), { status: 400 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), { status: 500 });
  }
}