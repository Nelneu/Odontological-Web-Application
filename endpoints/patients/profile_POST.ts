import { db } from "../../helpers/db";
import { schema, OutputType } from "./profile_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { z } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = await request.json();
    const validatedData = schema.parse(json);

    let targetPatientId: number;

    if (user.role === "patient") {
      const patient = await db
        .selectFrom("patients")
        .select("id")
        .where("userId", "=", user.id)
        .executeTakeFirst();

      if (!patient) {
        return new Response(
          superjson.stringify({ error: "Patient profile not found for this user." }),
          { status: 404 }
        );
      }
      targetPatientId = patient.id;
    } else if (user.role === "admin" || user.role === "dentist") {
      if (!validatedData.patientId) {
        return new Response(
          superjson.stringify({ error: "patientId is required for admin/dentist roles." }),
          { status: 400 }
        );
      }
      targetPatientId = validatedData.patientId;
    } else {
      return new Response(
        superjson.stringify({ error: "Forbidden. You do not have permission to update patient profiles." }),
        { status: 403 }
      );
    }

    const { patientId, ...updateData } = validatedData;

    const result = await db
      .updateTable("patients")
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where("id", "=", targetPatientId)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return new Response(
        superjson.stringify({ error: "Patient profile not found or update failed." }),
        { status: 404 }
      );
    }

    return new Response(superjson.stringify({ success: true, patient: result } satisfies OutputType));
  } catch (error) {
    console.error("Error updating patient profile:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input data", details: error.errors }), { status: 400 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred" }), { status: 500 });
  }
}