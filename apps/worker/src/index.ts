import { resolve } from "node:path";
import { InMemoryDatabase } from "@ai-platform/database";
import { processSubmission } from "./validation.js";

async function run(): Promise<void> {
  const db = new InMemoryDatabase();
  const user = db.createUser({
    email: "worker-demo@local.test",
    username: "worker-demo",
    passwordHash: "not-used",
    role: "developer"
  });
  const game = db.createGame({
    ownerUserId: user.id,
    slug: "worker-demo-game",
    title: "Worker Demo Game",
    shortDescription: "Demo game for worker validation",
    description: "Worker pipeline demonstration",
    genre: "arcade",
    visibility: "draft",
    status: "draft"
  });
  const version = db.createGameVersion({
    gameId: game.id,
    version: "1.0.0",
    manifestJson: {},
    sdkVersion: "1.0.0",
    runtimeVersionRange: ">=1.0.0",
    createdByUserId: user.id,
    validationStatus: "pending",
    smokeTestStatus: "pending"
  });
  const submission = db.createSubmission({
    gameVersionId: version.id,
    uploadedByUserId: user.id,
    sourceArchiveStorageKey: "fixtures/minimal-valid-game",
    validationReportJson: null,
    smokeTestReportJson: null,
    moderationNotes: null
  });

  const artifactRoot = resolve(
    process.cwd(),
    "../../packages/test-fixtures/fixtures/minimal-valid-game/artifact-root"
  );
  await processSubmission({
    db,
    versionId: version.id,
    submissionId: submission.id,
    artifactRoot
  });

  console.log("Worker run complete:", db.getVersion(version.id));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
