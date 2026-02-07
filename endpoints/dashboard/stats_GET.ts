import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./stats_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    let stats: OutputType;

    if (user.role === "dentist") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [appointmentsToday, totalPatients, upcomingAppointments] = await Promise.all([
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("dentistId", "=", user.id)
          .where("appointmentDate", ">=", todayStart)
          .where("appointmentDate", "<=", todayEnd)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("patientId").distinct().as("count"))
          .where("dentistId", "=", user.id)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("dentistId", "=", user.id)
          .where("appointmentDate", ">", new Date())
          .executeTakeFirstOrThrow(),
      ]);

      stats = {
        role: "dentist",
        appointmentsToday: parseInt(appointmentsToday.count, 10),
        totalPatients: parseInt(totalPatients.count, 10),
        upcomingAppointments: parseInt(upcomingAppointments.count, 10),
      };
    } else if (user.role === "patient") {
      const [nextAppointment, treatmentCount] = await Promise.all([
        db
          .selectFrom("appointments")
          .select("appointmentDate")
          .where("patientId", "=", user.id)
          .where("appointmentDate", ">", new Date())
          .orderBy("appointmentDate", "asc")
          .limit(1)
          .executeTakeFirst(),
        db
          .selectFrom("treatments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("patientId", "=", user.id)
          .executeTakeFirstOrThrow(),
      ]);

      stats = {
        role: "patient",
        nextAppointmentDate: nextAppointment?.appointmentDate ?? null,
        treatmentsCount: parseInt(treatmentCount.count, 10),
      };
    } else {
      // For admin or other roles, return generic stats or empty state
      stats = {
        role: user.role,
        // Add admin-specific stats if needed in the future
      };
    }

    return new Response(superjson.stringify(stats), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
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
