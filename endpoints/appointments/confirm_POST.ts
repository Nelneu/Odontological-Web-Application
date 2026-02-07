import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, InputType, OutputType } from "./confirm_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input: InputType = schema.parse(json);

    const appointment = await db
      .selectFrom("appointments")
      .select(["id", "patientId", "dentistId", "status"])
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!appointment) {
      return new Response(superjson.stringify({ error: "Appointment not found." }), {
        status: 404,
      });
    }

    // Authorization check: Only dentists and admins can confirm.
    if (user.role === "dentist" && appointment.dentistId !== user.id) {
      return new Response(
        superjson.stringify({ error: "You can only confirm appointments in your schedule." }),
        { status: 403 },
      );
    }
    if (user.role !== "admin" && user.role !== "dentist") {
      return new Response(
        superjson.stringify({ error: "You do not have permission to confirm appointments." }),
        { status: 403 },
      );
    }

    if (appointment.status !== "programada") {
      return new Response(
        superjson.stringify({
          error: `Cannot confirm an appointment with status '${appointment.status}'.`,
        }),
        { status: 400 },
      );
    }

    const updatedAppointment = await db
      .updateTable("appointments")
      .set({
        status: "confirmada",
        updatedAt: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({ appointment: updatedAppointment } satisfies OutputType),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error confirming appointment:", error);
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
