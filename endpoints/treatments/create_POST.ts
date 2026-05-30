import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./create_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin" && user.role !== "dentist") {
      return new Response(superjson.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const json = await request.json();
    const input = schema.parse(json);

    // Dentists can only create treatments for themselves
    if (user.role === "dentist" && input.dentistId !== user.id) {
      return new Response(
        superjson.stringify({ error: "Solo puede crear tratamientos asignados a usted" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verify patient exists
    const patient = await db
      .selectFrom("patients")
      .select("id")
      .where("id", "=", input.patientId)
      .executeTakeFirst();

    if (!patient) {
      return new Response(superjson.stringify({ error: "Paciente no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [treatment] = await db
      .insertInto("treatments")
      .values({
        treatmentType: input.treatmentType,
        patientId: input.patientId,
        dentistId: input.dentistId,
        appointmentId: input.appointmentId ?? null,
        description: input.description ?? null,
        toothNumber: input.toothNumber ?? null,
        cost: input.cost?.toString() ?? null,
        status: input.status ?? "pending",
        notes: input.notes ?? null,
      })
      .returning(["id", "treatmentType", "patientId", "dentistId"])
      .execute();

    return new Response(superjson.stringify({ treatment }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating treatment:", error);
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
