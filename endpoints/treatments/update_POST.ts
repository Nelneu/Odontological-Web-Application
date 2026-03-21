import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./update_POST.schema";
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
    const { treatmentId, ...updateFields } = schema.parse(json);

    // Check treatment exists
    const existing = await db
      .selectFrom("treatments")
      .select(["id", "dentistId"])
      .where("id", "=", treatmentId)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Tratamiento no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Dentists can only update their own treatments
    if (user.role === "dentist" && existing.dentistId !== user.id) {
      return new Response(
        superjson.stringify({ error: "Solo puede editar sus propios tratamientos" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (updateFields.treatmentType !== undefined) updateValues.treatmentType = updateFields.treatmentType;
    if (updateFields.description !== undefined) updateValues.description = updateFields.description;
    if (updateFields.toothNumber !== undefined) updateValues.toothNumber = updateFields.toothNumber;
    if (updateFields.cost !== undefined) updateValues.cost = updateFields.cost.toString();
    if (updateFields.status !== undefined) updateValues.status = updateFields.status;
    if (updateFields.notes !== undefined) updateValues.notes = updateFields.notes;

    const [updated] = await db
      .updateTable("treatments")
      .set(updateValues)
      .where("id", "=", treatmentId)
      .returning(["id", "treatmentType", "status"])
      .execute();

    return new Response(superjson.stringify({ treatment: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating treatment:", error);
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
