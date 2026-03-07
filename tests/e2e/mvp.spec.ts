import { test, expect, request } from "@playwright/test";
import { join, resolve } from "node:path";
import { createApiServer } from "../../apps/api/src/server.js";
import { InMemoryDatabase } from "../../packages/database/src/repositories.js";
import { InMemorySessionStore } from "../../packages/auth/src/index.js";
import { processSubmission } from "../../apps/worker/src/validation.js";

test.describe("AI Game Platform MVP e2e", () => {
  let baseUrl: string;
  const db = new InMemoryDatabase();
  const sessions = new InMemorySessionStore();
  const app = createApiServer({ db, sessions });

  test.beforeAll(async () => {
    await app.listen({ port: 4100, host: "127.0.0.1" });
    baseUrl = "http://127.0.0.1:4100";
  });

  test.afterAll(async () => {
    await app.close();
  });

  test("golden path: developer submit -> moderator publish -> player launch", async () => {
    const client = await request.newContext({ baseURL: baseUrl });

    await client.post("/auth/register", {
      data: {
        email: "dev@e2e.local",
        username: "dev-e2e",
        password: "password123",
        role: "developer"
      }
    });
    await client.post("/auth/register", {
      data: {
        email: "mod@e2e.local",
        username: "mod-e2e",
        password: "password123",
        role: "moderator"
      }
    });

    const developerLogin = await client.post("/auth/login", {
      data: { email: "dev@e2e.local", password: "password123" }
    });
    const developerSessionId = (await developerLogin.json()).sessionId as string;

    const moderatorLogin = await client.post("/auth/login", {
      data: { email: "mod@e2e.local", password: "password123" }
    });
    const moderatorSessionId = (await moderatorLogin.json()).sessionId as string;

    const gameResponse = await client.post("/games", {
      headers: { "x-session-id": developerSessionId },
      data: {
        slug: "e2e-galaxy",
        title: "E2E Galaxy",
        shortDescription: "E2E test game",
        description: "E2E test game description",
        genre: "arcade",
        visibility: "draft"
      }
    });
    const game = (await gameResponse.json()).game;

    const versionResponse = await client.post(`/games/${game.id}/versions`, {
      headers: { "x-session-id": developerSessionId },
      data: {
        version: "1.0.0",
        manifestJson: { id: "e2e-galaxy" },
        sdkVersion: "1.0.0",
        runtimeVersionRange: ">=1.0.0"
      }
    });
    const version = (await versionResponse.json()).version;

    const uploadResponse = await client.post(`/versions/${version.id}/upload`, {
      headers: { "x-session-id": developerSessionId },
      data: {
        sourceArchiveStorageKey: "packages/test-fixtures/fixtures/minimal-valid-game/artifact-root"
      }
    });
    const upload = await uploadResponse.json();

    await processSubmission({
      db,
      versionId: version.id,
      submissionId: upload.submission.id as string,
      artifactRoot: resolve(
        process.cwd(),
        "packages/test-fixtures/fixtures/minimal-valid-game/artifact-root"
      )
    });

    await client.post(`/versions/${version.id}/submit-for-review`, {
      headers: { "x-session-id": developerSessionId }
    });
    await client.post(`/versions/${version.id}/approve`, {
      headers: { "x-session-id": moderatorSessionId }
    });
    const publishResponse = await client.post(`/versions/${version.id}/publish`, {
      headers: { "x-session-id": moderatorSessionId }
    });
    expect(publishResponse.ok()).toBeTruthy();

    const publicGames = await client.get("/games");
    expect((await publicGames.json()).games.length).toBeGreaterThan(0);

    const playResponse = await client.post("/play-sessions", {
      data: { gameVersionId: version.id, runtimeVersion: "1.0.0" }
    });
    expect(playResponse.ok()).toBeTruthy();
    const playJson = await playResponse.json();
    expect(playJson.session.id).toBeTruthy();
    expect(playJson.sessionToken).toBeTruthy();
  });

  test("failure path: invalid artifact rejected by worker", async () => {
    const client = await request.newContext({ baseURL: baseUrl });

    await client.post("/auth/register", {
      data: {
        email: "dev-fail@e2e.local",
        username: "dev-fail",
        password: "password123",
        role: "developer"
      }
    });
    const developerLogin = await client.post("/auth/login", {
      data: { email: "dev-fail@e2e.local", password: "password123" }
    });
    const developerSessionId = (await developerLogin.json()).sessionId as string;

    const gameResponse = await client.post("/games", {
      headers: { "x-session-id": developerSessionId },
      data: {
        slug: "e2e-invalid",
        title: "E2E Invalid",
        shortDescription: "Invalid artifact game",
        description: "Should fail",
        genre: "arcade",
        visibility: "draft"
      }
    });
    const game = (await gameResponse.json()).game;

    const versionResponse = await client.post(`/games/${game.id}/versions`, {
      headers: { "x-session-id": developerSessionId },
      data: {
        version: "0.1.0",
        manifestJson: { id: "e2e-invalid" },
        sdkVersion: "1.0.0",
        runtimeVersionRange: ">=1.0.0"
      }
    });
    const version = (await versionResponse.json()).version;

    const uploadResponse = await client.post(`/versions/${version.id}/upload`, {
      headers: { "x-session-id": developerSessionId },
      data: {
        sourceArchiveStorageKey: "packages/test-fixtures/fixtures/invalid-manifest-game/artifact-root"
      }
    });
    const upload = await uploadResponse.json();

    await processSubmission({
      db,
      versionId: version.id,
      submissionId: upload.submission.id as string,
      artifactRoot: join(
        process.cwd(),
        "packages/test-fixtures/fixtures/invalid-manifest-game/artifact-root"
      )
    });
    const failedVersion = db.getVersion(version.id);
    expect(failedVersion?.validationStatus).toBe("failed");
  });
});
