import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { schema, InputType, OutputType } from "./appointments_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input: InputType = schema.parse(json);

    let patientId = input.patientId;
    const dentistId = input.dentistId;

    // Role-based validation
    if (user.role === "patient") {
      // Patients can only book for themselves.
      if (patientId && patientId !== user.id) {
        return new Response(
          superjson.stringify({ error: "Patients can only book appointments for themselves." }),
          { status: 403 },
        );
      }
      patientId = user.id;
    } else if (user.role === "dentist") {
      // Dentists can only book for their own schedule.
      if (dentistId !== user.id) {
        return new Response(
          superjson.stringify({
            error: "Dentists can only book appointments for their own schedule.",
          }),
          { status: 403 },
        );
      }
      if (!patientId) {
        return new Response(
          superjson.stringify({
            error: "Patient ID is required when a dentist creates an appointment.",
          }),
          { status: 400 },
        );
      }
    } else if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "You do not have permission to create appointments." }),
        { status: 403 },
      );
    }

    if (!patientId) {
      return new Response(superjson.stringify({ error: "Patient ID is required." }), {
        status: 400,
      });
    }

    const appointmentDate = new Date(input.appointmentDate);
    const appointmentEndDate = new Date(appointmentDate.getTime() + input.durationMinutes * 60000);

    // Check for conflicting appointments for the same dentist
    const conflictingAppointments = await db
      .selectFrom("appointments")
      .select("id")
      .where("dentistId", "=", dentistId)
      .where("status", "not in", ["cancelada", "ausente"])
      .where(
        sql`tsrange("appointment_date", "appointment_date" + "duration_minutes" * interval '1 minute') && tsrange(${appointmentDate}, ${appointmentEndDate})`,
      )
      .limit(1)
      .execute();

    if (conflictingAppointments.length > 0) {
      return new Response(
        superjson.stringify({
          error: "The selected time slot is no longer available. Please choose another time.",
        }),
        { status: 409 },
      );
    }

    // Create the appointment
    const newAppointment = await db
      .insertInto("appointments")
      .values({
        appointmentDate,
        durationMinutes: input.durationMinutes,
        reason: input.reason,
        notes: input.notes,
        dentistId,
        patientId,
        status: "programada", // Default status
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ appointment: newAppointment } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
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
