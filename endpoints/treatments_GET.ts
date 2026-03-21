import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { OutputType } from "./treatments_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (!["admin", "dentist", "patient"].includes(user.role)) {
      return new Response(superjson.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const patientIdParam = url.searchParams.get("patientId");

    let query = db
      .selectFrom("treatments")
      .leftJoin("patients", "treatments.patientId", "patients.id")
      .leftJoin("users as patientUser", "patients.userId", "patientUser.id")
      .leftJoin("users as dentistUser", "treatments.dentistId", "dentistUser.id")
      .select([
        "treatments.id",
        "treatments.patientId",
        "treatments.dentistId",
        "treatments.appointmentId",
        "treatments.treatmentType",
        "treatments.description",
        "treatments.toothNumber",
        "treatments.status",
        "treatments.cost",
        "treatments.notes",
        "treatments.createdAt",
        "treatments.updatedAt",
        "patientUser.displayName as patientName",
        "dentistUser.displayName as dentistName",
      ]);

    // Role-based filtering
    if (user.role === "dentist") {
      query = query.where("treatments.dentistId", "=", user.id);
    } else if (user.role === "patient") {
      query = query.where(
        "patients.userId",
        "=",
        user.id,
      );
    }
    // Admin sees all

    // Optional patient filter
    if (patientIdParam) {
      query = query.where("treatments.patientId", "=", parseInt(patientIdParam, 10));
    }

    const treatments = await query.orderBy("treatments.createdAt", "desc").execute();

    const response: OutputType = { treatments };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching treatments:", error);
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
