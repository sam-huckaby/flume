import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
export function verifyPassword(password, hashedPassword) {
    const [salt, storedHash] = hashedPassword.split(":");
    if (!salt || !storedHash) {
        return false;
    }
    const hashBuffer = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, "hex");
    return hashBuffer.length === storedBuffer.length && timingSafeEqual(hashBuffer, storedBuffer);
}
export class InMemorySessionStore {
    sessions = new Map();
    createSession(userId) {
        const sessionId = randomBytes(24).toString("hex");
        const session = {
            sessionId,
            userId,
            createdAt: new Date()
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }
}
export function requireRole(user, allowedRoles) {
    if (!user) {
        throw new Error("Authentication required");
    }
    if (!allowedRoles.includes(user.role)) {
        throw new Error("Insufficient role");
    }
}
//# sourceMappingURL=index.js.map