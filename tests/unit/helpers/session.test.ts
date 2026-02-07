// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  getServerSessionOrThrow,
  setServerSession,
  clearServerSession,
  NotAuthenticatedError,
  Session,
  SessionExpirationSeconds,
  CleanupProbability,
} from "../../../helpers/getSetServerSession";

describe("Session Constants", () => {
  it("has 1 week expiration", () => {
    expect(SessionExpirationSeconds).toBe(60 * 60 * 24 * 7);
    expect(SessionExpirationSeconds).toBe(604800);
  });

  it("has 10% cleanup probability", () => {
    expect(CleanupProbability).toBe(0.1);
  });
});

describe("NotAuthenticatedError", () => {
  it("creates error with default message", () => {
    const error = new NotAuthenticatedError();
    expect(error.message).toBe("Not authenticated");
    expect(error.name).toBe("NotAuthenticatedError");
  });

  it("creates error with custom message", () => {
    const error = new NotAuthenticatedError("Session expired");
    expect(error.message).toBe("Session expired");
    expect(error.name).toBe("NotAuthenticatedError");
  });

  it("is an instance of Error", () => {
    const error = new NotAuthenticatedError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("setServerSession / getServerSessionOrThrow round-trip", () => {
  it("sets and retrieves a session via JWT cookie", async () => {
    const session: Session = {
      id: "test-session-id-123",
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    // Create a response and set the session cookie
    const response = new Response("ok");
    await setServerSession(response, session);

    // Extract the cookie from the response
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("floot_built_app_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Partitioned");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain(`Max-Age=${SessionExpirationSeconds}`);

    // Extract the JWT token from the cookie
    const tokenMatch = setCookie!.match(/floot_built_app_session=([^;]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch![1];

    // Create a request with this cookie and verify it
    const request = new Request("http://localhost:3344/test", {
      headers: { cookie: `floot_built_app_session=${token}` },
    });

    const retrieved = await getServerSessionOrThrow(request);
    expect(retrieved.id).toBe(session.id);
    expect(retrieved.createdAt).toBe(session.createdAt);
    expect(retrieved.lastAccessed).toBe(session.lastAccessed);
  });

  it("preserves passwordChangeRequired flag", async () => {
    const session: Session = {
      id: "session-with-flag",
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      passwordChangeRequired: true,
    };

    const response = new Response("ok");
    await setServerSession(response, session);

    const setCookie = response.headers.get("Set-Cookie")!;
    const token = setCookie.match(/floot_built_app_session=([^;]+)/)![1];

    const request = new Request("http://localhost:3344/test", {
      headers: { cookie: `floot_built_app_session=${token}` },
    });

    const retrieved = await getServerSessionOrThrow(request);
    expect(retrieved.passwordChangeRequired).toBe(true);
  });
});

describe("getServerSessionOrThrow", () => {
  it("throws NotAuthenticatedError when no cookie present", async () => {
    const request = new Request("http://localhost:3344/test");
    await expect(getServerSessionOrThrow(request)).rejects.toThrow(
      NotAuthenticatedError
    );
  });

  it("throws NotAuthenticatedError for invalid JWT", async () => {
    const request = new Request("http://localhost:3344/test", {
      headers: { cookie: "floot_built_app_session=invalid-jwt-token" },
    });
    await expect(getServerSessionOrThrow(request)).rejects.toThrow(
      NotAuthenticatedError
    );
  });

  it("throws NotAuthenticatedError for wrong cookie name", async () => {
    const request = new Request("http://localhost:3344/test", {
      headers: { cookie: "wrong_cookie_name=somevalue" },
    });
    await expect(getServerSessionOrThrow(request)).rejects.toThrow(
      NotAuthenticatedError
    );
  });

  it("handles multiple cookies correctly", async () => {
    // First set a valid session
    const session: Session = {
      id: "multi-cookie-session",
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    const response = new Response("ok");
    await setServerSession(response, session);

    const setCookie = response.headers.get("Set-Cookie")!;
    const token = setCookie.match(/floot_built_app_session=([^;]+)/)![1];

    // Request with multiple cookies
    const request = new Request("http://localhost:3344/test", {
      headers: {
        cookie: `other_cookie=value; floot_built_app_session=${token}; another=test`,
      },
    });

    const retrieved = await getServerSessionOrThrow(request);
    expect(retrieved.id).toBe("multi-cookie-session");
  });
});

describe("clearServerSession", () => {
  it("sets expired cookie", () => {
    const response = new Response("ok");
    clearServerSession(response);

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("floot_built_app_session=");
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
  });
});
