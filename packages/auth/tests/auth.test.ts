import { describe, expect, it } from "vitest";
import {
  InMemorySessionStore,
  hashPassword,
  requireRole,
  verifyPassword
} from "../src/index.js";

describe("auth package", () => {
  it("verifies password success/failure", () => {
    const hash = hashPassword("secret123");
    expect(verifyPassword("secret123", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("supports session create/destroy", () => {
    const store = new InMemorySessionStore();
    const session = store.createSession("u1");
    expect(store.getSession(session.sessionId)?.userId).toBe("u1");
    store.destroySession(session.sessionId);
    expect(store.getSession(session.sessionId)).toBeNull();
  });

  it("enforces role checks", () => {
    expect(() =>
      requireRole(
        {
          id: "u1",
          email: "u1@example.com",
          username: "u1",
          role: "player"
        },
        ["moderator"]
      )
    ).toThrow(/insufficient role/i);
  });
});
