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
    } else if (user.role === "admin") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [
        totalUsersResult,
        totalPatientsResult,
        totalDentistsResult,
        appointmentsTodayResult,
        upcomingAppointmentsResult,
        completedAppointmentsResult,
        cancelledAppointmentsResult,
        totalTreatmentsResult,
        recentPatientsResult,
        appointmentsByStatusResult,
      ] = await Promise.all([
        db
          .selectFrom("users")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("patients")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("users")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("role", "=", "dentist")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("appointmentDate", ">=", todayStart)
          .where("appointmentDate", "<=", todayEnd)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("appointmentDate", ">", new Date())
          .where("status", "in", ["programada", "confirmada"])
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("status", "=", "completada")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("appointments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .where("status", "=", "cancelada")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("treatments")
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("patients")
          .innerJoin("users", "users.id", "patients.userId")
          .select(["users.displayName", "users.email", "patients.createdAt"])
          .orderBy("patients.createdAt", "desc")
          .limit(5)
          .execute(),
        db
          .selectFrom("appointments")
          .select(["status"])
          .select((eb) => eb.fn.count<string>("id").as("count"))
          .groupBy("status")
          .execute(),
      ]);

      const statusBreakdown: Record<string, number> = {};
      for (const row of appointmentsByStatusResult) {
        if (row.status) {
          statusBreakdown[row.status] = parseInt(row.count, 10);
        }
      }

      stats = {
        role: "admin" as const,
        totalUsers: parseInt(totalUsersResult.count, 10),
        totalPatients: parseInt(totalPatientsResult.count, 10),
        totalDentists: parseInt(totalDentistsResult.count, 10),
        appointmentsToday: parseInt(appointmentsTodayResult.count, 10),
        upcomingAppointments: parseInt(upcomingAppointmentsResult.count, 10),
        completedAppointments: parseInt(completedAppointmentsResult.count, 10),
        cancelledAppointments: parseInt(cancelledAppointmentsResult.count, 10),
        totalTreatments: parseInt(totalTreatmentsResult.count, 10),
        recentPatients: recentPatientsResult.map((p) => ({
          displayName: p.displayName,
          email: p.email,
          createdAt: p.createdAt,
        })),
        appointmentsByStatus: statusBreakdown,
      };
    } else {
      // For other roles, return generic stats
      stats = {
        role: user.role,
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
