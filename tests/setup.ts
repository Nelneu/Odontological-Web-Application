import "@testing-library/jest-dom/vitest";

// Set JWT_SECRET for session tests
process.env.JWT_SECRET = "test-jwt-secret-for-unit-tests-only";
process.env.FLOOT_DATABASE_URL = "postgresql://test:test@localhost:5432/test";
