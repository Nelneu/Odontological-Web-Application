import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { OutputType } from "./patients_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from '../helpers/getSetServerSession';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    let query = db.
    selectFrom("patients").
    innerJoin("users", "patients.userId", "users.id").
    selectAll("patients").
    select(["users.displayName", "users.email", "users.avatarUrl"]);

    if (user.role === "patient") {
      query = query.where("patients.userId", "=", user.id);
    } else if (user.role === "dentist") {
      // A dentist can see all patients they have an appointment with.
      query = query.where(
        "patients.userId",
        "in",
        db.
        selectFrom("appointments").
        select("appointments.patientId").
        where("appointments.dentistId", "=", user.id).
        distinct()
      );
    } else if (user.role !== "admin") {
      // 'user' role or other roles should not see any patients.
      return new Response(superjson.stringify({ patients: [] } satisfies OutputType), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // Admins can see all patients, so no additional where clause.

    const patients = await query.orderBy("users.displayName", "asc").execute();

    const response: OutputType = { patients };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), { status: 500 });
  }
}