import { describe, it, expect } from "vitest";
import { schema as profileGetSchema } from "../../../endpoints/patients/profile_GET.schema";
import { schema as profilePostSchema } from "../../../endpoints/patients/profile_POST.schema";
import { schema as registerSchema } from "../../../endpoints/patients/register_POST.schema";
import { schema as dentistsSchema } from "../../../endpoints/dentists_GET.schema";
import { schema as dashboardSchema } from "../../../endpoints/dashboard/stats_GET.schema";

describe("Patient Profile GET Schema", () => {
  it("accepts empty object (patient viewing own profile)", () => {
    const result = profileGetSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts patientId", () => {
    const result = profileGetSchema.safeParse({ patientId: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects negative patientId", () => {
    const result = profileGetSchema.safeParse({ patientId: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero patientId", () => {
    const result = profileGetSchema.safeParse({ patientId: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer patientId", () => {
    const result = profileGetSchema.safeParse({ patientId: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("Patient Profile POST Schema", () => {
  it("accepts empty update (no fields changed)", () => {
    const result = profilePostSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all fields", () => {
    const result = profilePostSchema.safeParse({
      patientId: 1,
      address: "Av. Corrientes 1234, CABA",
      phone: "+54 11 1234-5678",
      birthDate: "1990-05-15",
      allergies: "Penicilina",
      medicalHistory: "Hipertensión",
      emergencyContactName: "María García",
      emergencyContactPhone: "+54 11 8765-4321",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null allergies and medicalHistory", () => {
    const result = profilePostSchema.safeParse({
      allergies: null,
      medicalHistory: null,
    });
    expect(result.success).toBe(true);
  });

  it("coerces date strings to Date objects", () => {
    const result = profilePostSchema.safeParse({
      birthDate: "1990-05-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toBeInstanceOf(Date);
    }
  });

  it("rejects empty required-if-present strings", () => {
    expect(profilePostSchema.safeParse({ address: "" }).success).toBe(false);
    expect(profilePostSchema.safeParse({ phone: "" }).success).toBe(false);
    expect(profilePostSchema.safeParse({ emergencyContactName: "" }).success).toBe(false);
    expect(profilePostSchema.safeParse({ emergencyContactPhone: "" }).success).toBe(false);
  });
});

describe("Patient Register Schema", () => {
  const validPatient = {
    email: "paciente@example.com",
    password: "password123",
    displayName: "Juan Pérez",
    address: "Av. 9 de Julio 1234",
    phone: "+54 11 1234-5678",
    birthDate: "1985-03-20",
    emergencyContactName: "Ana Pérez",
    emergencyContactPhone: "+54 11 9876-5432",
  };

  it("accepts valid patient registration", () => {
    const result = registerSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
  });

  it("accepts with optional allergies and medicalHistory", () => {
    const result = registerSchema.safeParse({
      ...validPatient,
      allergies: "Latex",
      medicalHistory: "Diabetes tipo 2",
    });
    expect(result.success).toBe(true);
  });

  it("defaults allergies and medicalHistory to null", () => {
    const result = registerSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allergies).toBeNull();
      expect(result.data.medicalHistory).toBeNull();
    }
  });

  it("enforces minimum password length of 8", () => {
    const result = registerSchema.safeParse({
      ...validPatient,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("requires all mandatory fields", () => {
    const requiredFields = [
      "email",
      "password",
      "displayName",
      "address",
      "phone",
      "birthDate",
      "emergencyContactName",
      "emergencyContactPhone",
    ];

    for (const field of requiredFields) {
      const data = { ...validPatient };
      delete (data as any)[field];
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    }
  });

  it("validates email format", () => {
    const result = registerSchema.safeParse({
      ...validPatient,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("coerces birthDate to Date", () => {
    const result = registerSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toBeInstanceOf(Date);
    }
  });
});

describe("Dentists GET Schema", () => {
  it("accepts empty object", () => {
    const result = dentistsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Dashboard Stats GET Schema", () => {
  it("accepts empty object", () => {
    const result = dashboardSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
