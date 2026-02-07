import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, InputType, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input: InputType = schema.parse(json);

    const appointment = await db
      .selectFrom("appointments")
      .selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!appointment) {
      return new Response(superjson.stringify({ error: "Appointment not found." }), {
        status: 404,
      });
    }

    // Authorization check
    if (user.role === "patient" && appointment.patientId !== user.id) {
      return new Response(
        superjson.stringify({ error: "You can only update your own appointments." }),
        { status: 403 },
      );
    }
    if (user.role === "dentist" && appointment.dentistId !== user.id) {
      return new Response(
        superjson.stringify({ error: "You can only update appointments in your schedule." }),
        { status: 403 },
      );
    }
    if (user.role !== "admin" && user.role !== "dentist" && user.role !== "patient") {
      return new Response(
        superjson.stringify({ error: "You do not have permission to update appointments." }),
        { status: 403 },
      );
    }

    const { id, ...updateData } = input;
    const appointmentDate = updateData.appointmentDate
      ? new Date(updateData.appointmentDate)
      : appointment.appointmentDate;
    const durationMinutes = updateData.durationMinutes ?? appointment.durationMinutes;

    // If time is changing, check for conflicts
    if (updateData.appointmentDate || updateData.durationMinutes) {
      const appointmentEndDate = new Date(
        appointmentDate.getTime() + (durationMinutes || 60) * 60000,
      );
      const conflictingAppointments = await db
        .selectFrom("appointments")
        .select("id")
        .where("dentistId", "=", appointment.dentistId)
        .where("id", "!=", id)
        .where("status", "not in", ["cancelada", "ausente"])
        .where(
          sql`tsrange("appointment_date", "appointment_date" + "duration_minutes" * interval '1 minute') && tsrange(${appointmentDate}, ${appointmentEndDate})`,
        )
        .limit(1)
        .execute();

      if (conflictingAppointments.length > 0) {
        return new Response(
          superjson.stringify({
            error: "The selected time slot conflicts with another appointment.",
          }),
          { status: 409 },
        );
      }
    }

    const updatedAppointment = await db
      .updateTable("appointments")
      .set({
        ...updateData,
        appointmentDate: updateData.appointmentDate
          ? new Date(updateData.appointmentDate)
          : undefined,
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({ appointment: updatedAppointment } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating appointment:", error);
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
