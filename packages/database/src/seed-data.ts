import { readFile } from "node:fs/promises";
import { hashPassword } from "@ai-platform/auth";
import { InMemoryDatabase, type GameRecord, type GameVersionRecord, type UserRecord } from "./repositories.js";

type SeededUsers = {
  moderator: UserRecord;
  developer: UserRecord;
  player: UserRecord;
};

export type SeedDataResult = {
  users: SeededUsers;
  game: GameRecord;
  version: GameVersionRecord;
  exampleArtifactPath: string;
};

const THE_BUTTON_ARTIFACT_ROOT = "packages/sdk/example/the-button-game/artifact-root";

function getManifestPath(): URL {
  return new URL("../../sdk/example/the-button-game/artifact-root/manifest.json", import.meta.url);
}

async function loadTheButtonManifest(): Promise<Record<string, unknown>> {
  const manifest = await readFile(getManifestPath(), "utf8");
  return JSON.parse(manifest) as Record<string, unknown>;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export async function seedInMemoryDatabase(db: InMemoryDatabase): Promise<SeedDataResult> {
  const manifestJson = await loadTheButtonManifest();
  const manifestVersion = asString(manifestJson.version, "1.0.0");
  const sdkVersion = asString(manifestJson.sdkVersion, "1.0.0");
  const minRuntimeVersion = asString(manifestJson.minRuntimeVersion, "1.0.0");

  const moderator = db.createUser({
    email: "moderator@local.test",
    username: "mod",
    passwordHash: hashPassword("password123"),
    role: "moderator"
  });

  const developer = db.createUser({
    email: "developer@local.test",
    username: "dev",
    passwordHash: hashPassword("password123"),
    role: "developer"
  });

  const player = db.createUser({
    email: "player@local.test",
    username: "player",
    passwordHash: hashPassword("password123"),
    role: "player"
  });

  const game = db.createGame({
    ownerUserId: developer.id,
    slug: "the-button",
    title: "The Button",
    shortDescription: "SDK example game: click the button to win.",
    description: "Official SDK example game seeded for local play testing.",
    genre: "arcade",
    visibility: "public",
    status: "active"
  });

  const version = db.createGameVersion({
    gameId: game.id,
    version: manifestVersion,
    manifestJson,
    sdkVersion,
    runtimeVersionRange: `>=${minRuntimeVersion}`,
    createdByUserId: developer.id,
    validationStatus: "passed",
    smokeTestStatus: "passed",
    reviewState: "approved",
    publishState: "published",
    artifactStorageKey: THE_BUTTON_ARTIFACT_ROOT
  });

  db.createSubmission({
    gameVersionId: version.id,
    uploadedByUserId: developer.id,
    sourceArchiveStorageKey: THE_BUTTON_ARTIFACT_ROOT,
    validationReportJson: {
      status: "passed",
      source: "seed",
      artifactRoot: THE_BUTTON_ARTIFACT_ROOT
    },
    smokeTestReportJson: {
      status: "passed",
      source: "seed"
    },
    moderationNotes: "Auto-approved demo seed"
  });

  return {
    users: { moderator, developer, player },
    game,
    version,
    exampleArtifactPath: THE_BUTTON_ARTIFACT_ROOT
  };
}
