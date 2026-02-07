import { describe, it, expect } from "vitest";
import { generatePasswordHash } from "../../../helpers/generatePasswordHash";
import { compare } from "bcryptjs";

describe("generatePasswordHash", () => {
  it("generates a bcrypt hash", async () => {
    const hash = await generatePasswordHash("testpassword");
    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/); // bcrypt hash format
  });

  it("generates different hashes for the same password (due to salt)", async () => {
    const hash1 = await generatePasswordHash("samepassword");
    const hash2 = await generatePasswordHash("samepassword");
    expect(hash1).not.toBe(hash2);
  });

  it("produces hash that verifies correctly", async () => {
    const password = "MySecurePassword!123";
    const hash = await generatePasswordHash(password);
    const isValid = await compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("fails verification with wrong password", async () => {
    const hash = await generatePasswordHash("correctpassword");
    const isValid = await compare("wrongpassword", hash);
    expect(isValid).toBe(false);
  });

  it("handles special characters", async () => {
    const password = "p@$$wörd!¡¿ñ<>\"'";
    const hash = await generatePasswordHash(password);
    const isValid = await compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("handles empty string", async () => {
    const hash = await generatePasswordHash("");
    expect(hash).toBeTruthy();
    const isValid = await compare("", hash);
    expect(isValid).toBe(true);
  });

  it("handles very long passwords", async () => {
    const longPassword = "a".repeat(1000);
    const hash = await generatePasswordHash(longPassword);
    // bcrypt has a 72-byte limit, but it should still work (truncates internally)
    expect(hash).toBeTruthy();
  });
});
