import { db } from "../../helpers/db";
import { schema, OutputType } from "./profile_GET.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Patients, Users } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    const url = new URL(request.url);
    const patientIdStr = url.searchParams.get("patientId");
    const patientId = patientIdStr ? parseInt(patientIdStr, 10) : undefined;

    const { patientId: validatedPatientId } = schema.parse({ patientId });

    let targetPatientId: number | undefined = undefined;

    if (user.role === "patient") {
      const patient = await db
        .selectFrom("patients")
        .select("id")
        .where("userId", "=", user.id)
        .executeTakeFirst();
      if (!patient) {
        return new Response(
          superjson.stringify({ error: "Patient profile not found for this user." }),
          { status: 404 },
        );
      }
      if (validatedPatientId && validatedPatientId !== patient.id) {
        return new Response(
          superjson.stringify({ error: "Forbidden. Patients can only view their own profile." }),
          { status: 403 },
        );
      }
      targetPatientId = patient.id;
    } else if (user.role === "admin" || user.role === "dentist") {
      if (!validatedPatientId) {
        return new Response(
          superjson.stringify({ error: "patientId is required for admin/dentist roles." }),
          { status: 400 },
        );
      }
      targetPatientId = validatedPatientId;

      // Dentists now have full access to patient profiles like admins
    } else {
      return new Response(superjson.stringify({ error: "Forbidden. Insufficient permissions." }), {
        status: 403,
      });
    }

    if (!targetPatientId) {
      return new Response(superjson.stringify({ error: "Could not determine patient to fetch." }), {
        status: 400,
      });
    }

    const patientProfile = await db
      .selectFrom("patients")
      .innerJoin("users", "patients.userId", "users.id")
      .selectAll("patients")
      .select(["users.email", "users.displayName", "users.avatarUrl", "users.role"])
      .where("patients.id", "=", targetPatientId)
      .executeTakeFirst();

    if (!patientProfile) {
      return new Response(superjson.stringify({ error: "Patient profile not found." }), {
        status: 404,
      });
    }

    return new Response(superjson.stringify(patientProfile satisfies OutputType));
  } catch (error) {
    console.error("Error fetching patient profile:", error);
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
