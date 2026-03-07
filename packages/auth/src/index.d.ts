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
export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, hashedPassword: string): boolean;
export declare class InMemorySessionStore {
    private readonly sessions;
    createSession(userId: string): AuthSession;
    getSession(sessionId: string): AuthSession | null;
    destroySession(sessionId: string): void;
}
export declare function requireRole(user: AuthUser | null, allowedRoles: UserRole[]): asserts user is AuthUser;
//# sourceMappingURL=index.d.ts.map