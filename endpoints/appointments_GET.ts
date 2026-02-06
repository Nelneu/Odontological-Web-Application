import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema, OutputType } from "./appointments_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from '../helpers/getSetServerSession';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const input = schema.parse({
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate")
    });

    let query = db.
    selectFrom("appointments").
    innerJoin("patients", "appointments.patientId", "patients.id").
    innerJoin("users as patientUser", "patients.userId", "patientUser.id").
    innerJoin("users as dentistUser", "appointments.dentistId", "dentistUser.id").
    select([
    "appointments.id",
    "appointments.appointmentDate",
    "appointments.durationMinutes",
    "appointments.status",
    "appointments.reason",
    "appointments.notes",
    "patientUser.id as patientId",
    "patientUser.displayName as patientName",
    "dentistUser.id as dentistId",
    "dentistUser.displayName as dentistName"]
    );

    if (user.role === "dentist") {
      query = query.where("appointments.dentistId", "=", user.id);
    } else if (user.role === "patient") {
      query = query.where("patients.userId", "=", user.id);
    } else if (user.role !== "admin") {
      // 'user' role or any other unexpected role should not see any appointments
      return new Response(superjson.stringify({ appointments: [] } satisfies OutputType), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // Admins can see all appointments, so no additional where clause.

    if (input.startDate) {
      query = query.where("appointments.appointmentDate", ">=", new Date(input.startDate));
    }
    if (input.endDate) {
      query = query.where("appointments.appointmentDate", "<=", new Date(input.endDate));
    }

    const appointments = await query.orderBy("appointments.appointmentDate", "asc").execute();

    const response: OutputType = {
      appointments: appointments.map((a) => ({
        ...a,
        patient: { id: a.patientId, displayName: a.patientName },
        dentist: { id: a.dentistId, displayName: a.dentistName }
      }))
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), { status: 500 });
  }
}