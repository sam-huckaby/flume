import { createHash, randomBytes } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import {
  InMemorySessionStore,
  hashPassword,
  requireRole,
  verifyPassword,
  type AuthUser
} from "@ai-platform/auth";
import { InMemoryDatabase } from "@ai-platform/database";
import { createLogger } from "@ai-platform/observability";
import { telemetryEventSchema } from "@ai-platform/runtime-contract";
import { ZodError, z } from "zod";

const logger = createLogger("api");
const MAX_SAVE_STATE_BYTES = 64 * 1024;
const MAX_TELEMETRY_PAYLOAD_BYTES = 16 * 1024;

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(80),
  password: z.string().min(8),
  role: z.enum(["player", "developer", "moderator", "admin"]).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const createGameSchema = z.object({
  slug: z.string().min(3).max(120),
  title: z.string().min(1).max(120),
  shortDescription: z.string().min(1).max(250),
  description: z.string().min(1),
  genre: z.string().min(1).max(80),
  visibility: z.enum(["draft", "public", "unlisted"]).default("draft")
});

const createVersionSchema = z.object({
  version: z.string().min(1),
  manifestJson: z.record(z.string(), z.unknown()),
  sdkVersion: z.string().min(1),
  runtimeVersionRange: z.string().min(1)
});

const uploadSchema = z.object({
  sourceArchiveStorageKey: z.string().min(1),
  artifactStorageKey: z.string().min(1).optional(),
  artifactHash: z.string().min(3).optional()
});

const playSessionSchema = z.object({
  gameVersionId: z.string().uuid(),
  runtimeVersion: z.string().min(1)
});

const saveSchema = z.object({
  gameVersionId: z.string().uuid(),
  state: z.unknown()
});

const scoreSchema = z.object({
  gameVersionId: z.string().uuid(),
  score: z.number().finite(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

type ApiContext = {
  db: InMemoryDatabase;
  sessions: InMemorySessionStore;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function serializeSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function getAuthUser(ctx: ApiContext, request: FastifyRequest): AuthUser | null {
  const sessionId = request.headers["x-session-id"];
  if (!sessionId || Array.isArray(sessionId)) {
    return null;
  }
  const session = ctx.sessions.getSession(sessionId);
  if (!session) {
    return null;
  }
  const user = ctx.db.getUserById(session.userId);
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
}

function getUserFromRuntimeToken(ctx: ApiContext, request: FastifyRequest): AuthUser | null {
  const token = request.headers["x-session-token"];
  if (!token || Array.isArray(token)) {
    return null;
  }
  const tokenHash = hashToken(token);
  const playSession = [...ctx.db.playSessions.values()].find((session) => session.sessionTokenHash === tokenHash);
  if (!playSession || !playSession.playerUserId) {
    return null;
  }
  const user = ctx.db.getUserById(playSession.playerUserId);
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
}

export function createApiServer(context?: Partial<ApiContext>): FastifyInstance {
  const app = Fastify({ logger: false });
  const ctx: ApiContext = {
    db: context?.db ?? new InMemoryDatabase(),
    sessions: context?.sessions ?? new InMemorySessionStore()
  };

  app.decorate("ctx", ctx);
  app.setErrorHandler((error, _request, reply) => {
    const message = error instanceof Error ? error.message : "unknown";
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: "Invalid request payload", details: error.issues });
    }
    if (/Authentication required/i.test(message)) {
      return reply.status(401).send({ error: message });
    }
    if (/Insufficient role/i.test(message)) {
      return reply.status(403).send({ error: message });
    }
    if (/Invalid .* transition|Cannot publish/i.test(message)) {
      return reply.status(400).send({ error: message });
    }
    logger.error("api_unhandled_error", { message });
    return reply.status(500).send({ error: "Internal server error" });
  });

  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    if (ctx.db.getUserByEmail(body.email)) {
      return reply.status(409).send({ error: "Email already used" });
    }
    const user = ctx.db.createUser({
      email: body.email,
      username: body.username,
      passwordHash: hashPassword(body.password),
      role: body.role ?? "player"
    });
    return reply.status(201).send({ id: user.id, email: user.email, username: user.username, role: user.role });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = ctx.db.getUserByEmail(body.email);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const session = ctx.sessions.createSession(user.id);
    return reply.send({
      sessionId: session.sessionId,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    });
  });

  app.post("/auth/logout", async (request, reply) => {
    const sessionId = request.headers["x-session-id"];
    if (typeof sessionId === "string") {
      ctx.sessions.destroySession(sessionId);
    }
    return reply.status(204).send();
  });

  app.get("/auth/me", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    return reply.send({ user });
  });

  app.post("/games", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["developer", "admin"]);
    const body = createGameSchema.parse(request.body);
    const game = ctx.db.createGame({
      ownerUserId: user.id,
      slug: body.slug,
      title: body.title,
      shortDescription: body.shortDescription,
      description: body.description,
      genre: body.genre,
      visibility: body.visibility,
      status: "draft"
    });
    return reply.status(201).send({ game });
  });

  app.get("/games", async (request) => {
    const parsedQuery = z
      .object({
        includeDrafts: z.enum(["true", "false"]).optional()
      })
      .parse(request.query ?? {});
    const includeDrafts = parsedQuery.includeDrafts === "true";
    return { games: ctx.db.listGames(includeDrafts) };
  });

  app.get("/games/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const game = ctx.db.getGameBySlug(slug);
    if (!game) {
      return reply.status(404).send({ error: "Game not found" });
    }
    return { game };
  });

  app.patch("/games/:gameId", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["developer", "admin"]);
    const { gameId } = request.params as { gameId: string };
    const existing = ctx.db.games.get(gameId);
    if (!existing) {
      return reply.status(404).send({ error: "Game not found" });
    }
    if (user.role !== "admin" && existing.ownerUserId !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const updates = createGameSchema.partial().parse(request.body);
    const game = ctx.db.updateGame(gameId, updates);
    return { game };
  });

  app.post("/games/:gameId/versions", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["developer", "admin"]);
    const { gameId } = request.params as { gameId: string };
    const body = createVersionSchema.parse(request.body);
    const version = ctx.db.createGameVersion({
      gameId,
      version: body.version,
      manifestJson: body.manifestJson,
      sdkVersion: body.sdkVersion,
      runtimeVersionRange: body.runtimeVersionRange,
      createdByUserId: user.id,
      validationStatus: "pending",
      smokeTestStatus: "pending"
    });
    return reply.status(201).send({ version });
  });

  app.get("/games/:gameId/versions", async (request) => {
    const { gameId } = request.params as { gameId: string };
    return { versions: ctx.db.listVersions(gameId) };
  });

  app.get("/versions/:versionId", async (request, reply) => {
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.getVersion(versionId);
    if (!version) {
      return reply.status(404).send({ error: "Version not found" });
    }
    return { version };
  });

  app.post("/versions/:versionId/upload", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["developer", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.getVersion(versionId);
    if (!version) {
      return reply.status(404).send({ error: "Version not found" });
    }
    const body = uploadSchema.parse(request.body);
    const updatedVersion = ctx.db.updateVersion(versionId, {
      artifactStorageKey: body.artifactStorageKey ?? body.sourceArchiveStorageKey,
      artifactHash: body.artifactHash ?? null
    });
    const submission = ctx.db.createSubmission({
      gameVersionId: versionId,
      uploadedByUserId: user.id,
      sourceArchiveStorageKey: body.sourceArchiveStorageKey,
      validationReportJson: null,
      smokeTestReportJson: null,
      moderationNotes: null
    });
    return reply.status(201).send({ submission, version: updatedVersion });
  });

  app.post("/versions/:versionId/submit-for-review", async (request) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["developer", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.setReviewState(versionId, "pending_review");
    return { version };
  });

  app.post("/versions/:versionId/approve", async (request) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["moderator", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.setReviewState(versionId, "approved");
    return { version };
  });

  app.post("/versions/:versionId/reject", async (request) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["moderator", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.setReviewState(versionId, "rejected");
    return { version };
  });

  app.post("/versions/:versionId/publish", async (request) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["moderator", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.setPublishState(versionId, "published");
    const game = ctx.db.games.get(version.gameId);
    if (game) {
      ctx.db.updateGame(game.id, { visibility: "public", status: "active" });
    }
    return { version };
  });

  app.post("/versions/:versionId/revoke", async (request) => {
    const user = getAuthUser(ctx, request);
    requireRole(user, ["moderator", "admin"]);
    const { versionId } = request.params as { versionId: string };
    const version = ctx.db.setPublishState(versionId, "revoked");
    return { version };
  });

  app.post("/play-sessions", async (request, reply) => {
    const user = getAuthUser(ctx, request);
    const body = playSessionSchema.parse(request.body);
    const version = ctx.db.getVersion(body.gameVersionId);
    if (!version || version.publishState !== "published") {
      return reply.status(400).send({ error: "Game version is not published" });
    }
    const sessionToken = randomBytes(24).toString("hex");
    const playSession = ctx.db.createPlaySession({
      gameVersionId: body.gameVersionId,
      playerUserId: user?.id ?? null,
      runtimeVersion: body.runtimeVersion,
      sessionTokenHash: hashToken(sessionToken),
      telemetrySummaryJson: null
    });
    return reply.status(201).send({
      session: playSession,
      sessionToken,
      bootstrap: {
        sessionId: playSession.id,
        gameVersionId: body.gameVersionId
      }
    });
  });

  app.post("/play-sessions/:sessionId/heartbeat", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const token = request.headers["x-session-token"];
    if (typeof token !== "string") {
      return reply.status(401).send({ error: "Missing session token" });
    }
    const session = ctx.db.playSessions.get(sessionId);
    if (!session || session.sessionTokenHash !== hashToken(token)) {
      return reply.status(401).send({ error: "Invalid session token" });
    }
    return reply.status(204).send();
  });

  app.post("/play-sessions/:sessionId/end", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const token = request.headers["x-session-token"];
    if (typeof token !== "string") {
      return reply.status(401).send({ error: "Missing session token" });
    }
    const session = ctx.db.playSessions.get(sessionId);
    if (!session || session.sessionTokenHash !== hashToken(token)) {
      return reply.status(401).send({ error: "Invalid session token" });
    }
    const body = z
      .object({
        exitReason: z.string().min(1),
        telemetrySummaryJson: z.record(z.string(), z.unknown()).optional()
      })
      .parse(request.body);
    const ended = ctx.db.endPlaySession(sessionId, body.exitReason, body.telemetrySummaryJson ?? null);
    return { session: ended };
  });

  app.put("/games/:gameId/saves/:slotKey", async (request, reply) => {
    const user = getAuthUser(ctx, request) ?? getUserFromRuntimeToken(ctx, request);
    requireRole(user, ["player", "developer", "moderator", "admin"]);
    const params = request.params as { gameId: string; slotKey: string };
    const body = saveSchema.parse(request.body);
    const payloadSize = serializeSize(body.state);
    if (payloadSize > MAX_SAVE_STATE_BYTES) {
      return reply.status(413).send({ error: "State payload too large" });
    }
    const save = ctx.db.upsertSaveState({
      playerUserId: user.id,
      gameId: params.gameId,
      gameVersionId: body.gameVersionId,
      slotKey: params.slotKey,
      stateJson: body.state as Record<string, unknown>,
      stateSizeBytes: payloadSize
    });
    return { save };
  });

  app.get("/games/:gameId/saves/:slotKey", async (request, reply) => {
    const user = getAuthUser(ctx, request) ?? getUserFromRuntimeToken(ctx, request);
    requireRole(user, ["player", "developer", "moderator", "admin"]);
    const { gameId, slotKey } = request.params as { gameId: string; slotKey: string };
    const save = ctx.db.getSaveState(user.id, gameId, slotKey);
    if (!save) {
      return reply.status(404).send({ error: "Save not found" });
    }
    return { save };
  });

  app.post("/games/:gameId/scores", async (request) => {
    const user = getAuthUser(ctx, request) ?? getUserFromRuntimeToken(ctx, request);
    const params = request.params as { gameId: string };
    const body = scoreSchema.parse(request.body);
    const score = ctx.db.insertScore({
      gameId: params.gameId,
      gameVersionId: body.gameVersionId,
      playerUserId: user?.id ?? null,
      score: body.score,
      metadataJson: body.metadata ?? null
    });
    return { score };
  });

  app.get("/games/:gameId/scores", async (request) => {
    const params = request.params as { gameId: string };
    return { scores: ctx.db.listScores(params.gameId) };
  });

  app.post("/telemetry/events", async (request, reply) => {
    const body = telemetryEventSchema.parse(request.body);
    if (serializeSize(body.payload ?? {}) > MAX_TELEMETRY_PAYLOAD_BYTES) {
      return reply.status(413).send({ error: "Telemetry payload too large" });
    }
    logger.info("telemetry_event_ingested", { name: body.name, sessionId: body.sessionId, gameId: body.gameId });
    return reply.status(202).send({ accepted: true });
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    ctx: ApiContext;
  }
}
