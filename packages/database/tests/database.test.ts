import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { InMemoryDatabase } from "../src/repositories.js";
import { seedInMemoryDatabase } from "../src/seed-data.js";

describe("database migrations", () => {
  it("contains schema creation for required core tables", () => {
    const migration = readFileSync(resolve(process.cwd(), "migrations", "0001_init.sql"), "utf8");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS games");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS game_versions");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS submissions");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS play_sessions");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS save_states");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS score_entries");
  });
});

describe("repository CRUD and state transitions", () => {
  it("creates users, games, and versions", () => {
    const db = new InMemoryDatabase();
    const user = db.createUser({
      email: "dev@test.local",
      username: "dev",
      passwordHash: "hash",
      role: "developer"
    });
    const game = db.createGame({
      ownerUserId: user.id,
      slug: "space-runner",
      title: "Space Runner",
      shortDescription: "Arcade runner.",
      description: "Arcade runner built via SDK.",
      genre: "arcade",
      visibility: "draft",
      status: "draft"
    });
    const version = db.createGameVersion({
      gameId: game.id,
      version: "1.0.0",
      manifestJson: { id: "space-runner" },
      sdkVersion: "1.0.0",
      runtimeVersionRange: ">=1.0.0",
      createdByUserId: user.id,
      validationStatus: "pending",
      smokeTestStatus: "pending"
    });

    expect(db.getUserByEmail("dev@test.local")?.id).toBe(user.id);
    expect(db.getGameBySlug("space-runner")?.id).toBe(game.id);
    expect(db.getVersion(version.id)?.id).toBe(version.id);
  });

  it("enforces review/publish transitions", () => {
    const db = new InMemoryDatabase();
    const user = db.createUser({
      email: "dev2@test.local",
      username: "dev2",
      passwordHash: "hash",
      role: "developer"
    });
    const game = db.createGame({
      ownerUserId: user.id,
      slug: "tower-defender",
      title: "Tower Defender",
      shortDescription: "Defend your base.",
      description: "A minimal tower defense game.",
      genre: "strategy",
      visibility: "draft",
      status: "draft"
    });
    const version = db.createGameVersion({
      gameId: game.id,
      version: "0.1.0",
      manifestJson: { id: "tower-defender" },
      sdkVersion: "1.0.0",
      runtimeVersionRange: ">=1.0.0",
      createdByUserId: user.id,
      validationStatus: "passed",
      smokeTestStatus: "passed"
    });

    expect(() => db.setPublishState(version.id, "published")).toThrow(/non-approved/i);
    db.setReviewState(version.id, "pending_review");
    db.setReviewState(version.id, "approved");
    const published = db.setPublishState(version.id, "published");
    expect(published.publishState).toBe("published");
  });

  it("seeds SDK example game as published", async () => {
    const db = new InMemoryDatabase();
    const seeded = await seedInMemoryDatabase(db);

    expect(seeded.game.slug).toBe("the-button");
    expect(seeded.version.publishState).toBe("published");
    expect(seeded.version.reviewState).toBe("approved");
    expect(seeded.version.artifactStorageKey).toContain("packages/sdk/example/the-button-game/artifact-root");
    expect(db.listGames().map((game) => game.slug)).toContain("the-button");
  });
});
