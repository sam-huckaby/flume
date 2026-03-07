import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type UserRole = "player" | "developer" | "moderator" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
};

export type AuthSession = {
  sessionId: string;
  userId: string;
  createdAt: Date;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, storedHash] = hashedPassword.split(":");
  if (!salt || !storedHash) {
    return false;
  }
  const hashBuffer = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");
  return hashBuffer.length === storedBuffer.length && timingSafeEqual(hashBuffer, storedBuffer);
}

export class InMemorySessionStore {
  private readonly sessions = new Map<string, AuthSession>();

  createSession(userId: string): AuthSession {
    const sessionId = randomBytes(24).toString("hex");
    const session = {
      sessionId,
      userId,
      createdAt: new Date()
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): AuthSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export function requireRole(user: AuthUser | null, allowedRoles: UserRole[]): asserts user is AuthUser {
  if (!user) {
    throw new Error("Authentication required");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient role");
  }
}
