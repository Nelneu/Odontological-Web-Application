/**
 * Seed script: inserts test users for local development.
 *
 * Users:
 *   admin@test.com    / 123456  (role: admin)
 *   prof@test.com     / 123456  (role: dentist)
 *   paciente@test.com / 123456  (role: patient)
 *
 * Run with: pnpm exec tsx scripts/seed.ts
 * Idempotent: skips users that already exist.
 */

import "../loadEnv.js";
import { db } from "../helpers/db";
import { generatePasswordHash } from "../helpers/generatePasswordHash";
import { sql } from "kysely";

const TEST_PASSWORD = "123456";

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
      console.log(`  Skipped (already exists): ${userData.email}`);
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
