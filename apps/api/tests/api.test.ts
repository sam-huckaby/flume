import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiServer } from "../src/server.js";
import type { FastifyInstance } from "fastify";

describe("API routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = createApiServer();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  async function registerAndLogin(email: string, role: string) {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email,
        username: email.split("@")[0],
        password: "password123",
        role
      }
    });
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email,
        password: "password123"
      }
    });
    const parsed = login.json();
    return parsed.sessionId as string;
  }

  function createPublishedArtifactVersion() {
    const owner = app.ctx.db.createUser({
      email: "seed-dev@test.local",
      username: "seed-dev",
      passwordHash: "hash",
      role: "developer"
    });
    const game = app.ctx.db.createGame({
      ownerUserId: owner.id,
      slug: "the-button",
      title: "The Button",
      shortDescription: "SDK example game",
      description: "Seeded local demo game",
      genre: "arcade",
      visibility: "public",
      status: "active"
    });
    const version = app.ctx.db.createGameVersion({
      gameId: game.id,
      version: "1.0.0",
      manifestJson: { id: "example-the-button" },
      sdkVersion: "1.0.0",
      runtimeVersionRange: ">=1.0.0",
      createdByUserId: owner.id,
      validationStatus: "passed",
      smokeTestStatus: "passed",
      reviewState: "approved",
      publishState: "published",
      artifactStorageKey: "packages/sdk/example/the-button-game/artifact-root"
    });
    return { game, version };
  }

  it("supports login success and failure", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "player@test.local",
        username: "player",
        password: "password123",
        role: "player"
      }
    });

    const success = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "player@test.local", password: "password123" }
    });
    expect(success.statusCode).toBe(200);

    const failure = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "player@test.local", password: "bad" }
    });
    expect(failure.statusCode).toBe(401);
  });

  it("blocks publishing before approval", async () => {
    const developerSession = await registerAndLogin("dev@test.local", "developer");
    const moderatorSession = await registerAndLogin("mod@test.local", "moderator");

    const gameResponse = await app.inject({
      method: "POST",
      url: "/games",
      headers: { "x-session-id": developerSession },
      payload: {
        slug: "space-bots",
        title: "Space Bots",
        shortDescription: "A test game",
        description: "A test game description",
        genre: "arcade",
        visibility: "draft"
      }
    });
    const game = gameResponse.json().game;

    const versionResponse = await app.inject({
      method: "POST",
      url: `/games/${game.id}/versions`,
      headers: { "x-session-id": developerSession },
      payload: {
        version: "1.0.0",
        manifestJson: { id: "space-bots" },
        sdkVersion: "1.0.0",
        runtimeVersionRange: ">=1.0.0"
      }
    });
    const version = versionResponse.json().version;

    const invalidPublish = await app.inject({
      method: "POST",
      url: `/versions/${version.id}/publish`,
      headers: { "x-session-id": moderatorSession }
    });
    expect(invalidPublish.statusCode).toBe(400);
  });

  it("supports moderation, play sessions, saves, and scores", async () => {
    const developerSession = await registerAndLogin("dev2@test.local", "developer");
    const moderatorSession = await registerAndLogin("mod2@test.local", "moderator");
    const playerSession = await registerAndLogin("player2@test.local", "player");

    const gameResponse = await app.inject({
      method: "POST",
      url: "/games",
      headers: { "x-session-id": developerSession },
      payload: {
        slug: "nova-chase",
        title: "Nova Chase",
        shortDescription: "Arcade chase",
        description: "Arcade chase game",
        genre: "arcade",
        visibility: "draft"
      }
    });
    const game = gameResponse.json().game;

    const versionResponse = await app.inject({
      method: "POST",
      url: `/games/${game.id}/versions`,
      headers: { "x-session-id": developerSession },
      payload: {
        version: "1.0.0",
        manifestJson: { id: "nova-chase" },
        sdkVersion: "1.0.0",
        runtimeVersionRange: ">=1.0.0"
      }
    });
    const version = versionResponse.json().version;

    await app.inject({
      method: "POST",
      url: `/versions/${version.id}/upload`,
      headers: { "x-session-id": developerSession },
      payload: { sourceArchiveStorageKey: "fixtures/nova-chase.zip" }
    });
    await app.inject({
      method: "POST",
      url: `/versions/${version.id}/submit-for-review`,
      headers: { "x-session-id": developerSession }
    });
    await app.inject({
      method: "POST",
      url: `/versions/${version.id}/approve`,
      headers: { "x-session-id": moderatorSession }
    });
    const publish = await app.inject({
      method: "POST",
      url: `/versions/${version.id}/publish`,
      headers: { "x-session-id": moderatorSession }
    });
    expect(publish.statusCode).toBe(200);

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/play-sessions",
      headers: { "x-session-id": playerSession },
      payload: {
        gameVersionId: version.id,
        runtimeVersion: "1.0.0"
      }
    });
    expect(sessionResponse.statusCode).toBe(201);
    const { session, sessionToken } = sessionResponse.json();

    const save = await app.inject({
      method: "PUT",
      url: `/games/${game.id}/saves/autosave`,
      headers: { "x-session-id": playerSession },
      payload: {
        gameVersionId: version.id,
        state: { level: 2, hp: 5 }
      }
    });
    expect(save.statusCode).toBe(200);

    const load = await app.inject({
      method: "GET",
      url: `/games/${game.id}/saves/autosave`,
      headers: { "x-session-id": playerSession }
    });
    expect(load.statusCode).toBe(200);

    const score = await app.inject({
      method: "POST",
      url: `/games/${game.id}/scores`,
      headers: { "x-session-id": playerSession },
      payload: { gameVersionId: version.id, score: 1234 }
    });
    expect(score.statusCode).toBe(200);

    const end = await app.inject({
      method: "POST",
      url: `/play-sessions/${session.id}/end`,
      headers: { "x-session-token": sessionToken },
      payload: { exitReason: "player_exit" }
    });
    expect(end.statusCode).toBe(200);
  });

  it("returns an artifact bootstrap URL and serves published artifact files with CORS", async () => {
    const playerSession = await registerAndLogin("player-artifact@test.local", "player");
    const { version } = createPublishedArtifactVersion();

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/play-sessions",
      headers: {
        "x-session-id": playerSession,
        host: "localhost:4000"
      },
      payload: {
        gameVersionId: version.id,
        runtimeVersion: "1.0.0"
      }
    });

    expect(sessionResponse.statusCode).toBe(201);
    expect(sessionResponse.json().bootstrap.artifactBaseUrl).toBe(`http://localhost:4000/versions/${version.id}/artifact`);

    const preflight = await app.inject({
      method: "OPTIONS",
      url: "/telemetry/events",
      headers: {
        origin: "http://localhost:3001",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-session-token"
      }
    });

    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe("http://localhost:3001");

    const manifest = await app.inject({
      method: "GET",
      url: `/versions/${version.id}/artifact/manifest.json`,
      headers: {
        origin: "http://localhost:3001"
      }
    });

    expect(manifest.statusCode).toBe(200);
    expect(manifest.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
    expect(manifest.json()).toMatchObject({ id: "example-the-button", title: "The Button" });
  });

  it("rejects artifact path traversal requests", async () => {
    const { version } = createPublishedArtifactVersion();

    const manifest = await app.inject({
      method: "GET",
      url: `/versions/${version.id}/artifact/..%2Fmanifest.json`
    });

    expect(manifest.statusCode).toBe(400);
  });
});
