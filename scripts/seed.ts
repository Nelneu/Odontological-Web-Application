/**
 * Seed script: inserts test users for local development.
 *
 * Users:
 *   admin@test.com    / Test1234  (role: admin)
 *   prof@test.com     / Test1234  (role: dentist)
 *   paciente@test.com / Test1234  (role: patient)
 *
 * Run with: pnpm exec tsx scripts/seed.ts
 * Idempotent: creates users if missing, updates passwords if they already exist.
 */

import "../loadEnv.js";
import { db } from "../helpers/db";
import { generatePasswordHash } from "../helpers/generatePasswordHash";
import { sql } from "kysely";

const TEST_PASSWORD = "Test1234";

const testUsers = [
  { email: "admin@test.com", displayName: "Administrador", role: "admin" as const },
  { email: "prof@test.com", displayName: "Profesional", role: "dentist" as const },
  { email: "paciente@test.com", displayName: "Paciente", role: "patient" as const },
];

async function seed() {
  console.log("Seeding test users...");

  const passwordHash = await generatePasswordHash(TEST_PASSWORD);

  for (const userData of testUsers) {
    // Insert user, skip if email already exists
    const existing = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", userData.email)
      .executeTakeFirst();

    if (existing) {
      // User exists — ensure password is set and up to date
      const existingPassword = await db
        .selectFrom("userPasswords")
        .select("id")
        .where("userId", "=", existing.id)
        .executeTakeFirst();

      if (existingPassword) {
        await db
          .updateTable("userPasswords")
          .set({ passwordHash })
          .where("userId", "=", existing.id)
          .execute();
      } else {
        await db
          .insertInto("userPasswords")
          .values({ userId: existing.id, passwordHash })
          .execute();
      }

      console.log(`  Updated password: ${userData.email}`);
      continue;
    }

    const [user] = await db
      .insertInto("users")
      .values({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
      })
      .returning(["id"])
      .execute();

    await db
      .insertInto("userPasswords")
      .values({
        userId: user.id,
        passwordHash,
      })
      .execute();

    // Create a patients record for patient-role users
    if (userData.role === "patient") {
      await db
        .insertInto("patients")
        .values({
          userId: user.id,
        })
        .execute();
    }

    console.log(`  Created: ${userData.email} (${userData.role})`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
