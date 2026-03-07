import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { InMemoryDatabase } from "@ai-platform/database";
import { processSubmission, validateArtifactDirectory } from "../src/validation.js";

const fixturesRoot = resolve(process.cwd(), "../../packages/test-fixtures/fixtures");

async function copyFixture(name: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "worker-fixture-"));
  const target = join(dir, "artifact-root");
  await cp(join(fixturesRoot, name, "artifact-root"), target, { recursive: true });
  return target;
}

describe("worker artifact validation", () => {
  it("passes a valid archive", async () => {
    const artifactRoot = await copyFixture("minimal-valid-game");
    const result = await validateArtifactDirectory(artifactRoot);
    expect(result.ok).toBe(true);
    await rm(resolve(artifactRoot, ".."), { recursive: true, force: true });
  });

  it("fails if manifest is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "worker-missing-manifest-"));
    await mkdir(join(dir, "dist"));
    await writeFile(join(dir, "dist/main.js"), "export default { init() {}, start() {} }");
    const result = await validateArtifactDirectory(dir);
    expect(result.ok).toBe(false);
    expect(result.report.reason).toBe("missing_manifest");
    await rm(dir, { recursive: true, force: true });
  });

  it("fails invalid manifest", async () => {
    const artifactRoot = await copyFixture("invalid-manifest-game");
    const result = await validateArtifactDirectory(artifactRoot);
    expect(result.ok).toBe(false);
    await rm(resolve(artifactRoot, ".."), { recursive: true, force: true });
  });

  it("fails missing entry", async () => {
    const artifactRoot = await copyFixture("minimal-valid-game");
    await rm(join(artifactRoot, "dist", "main.js"), { force: true });
    const result = await validateArtifactDirectory(artifactRoot);
    expect(result.ok).toBe(false);
    expect(result.report.reason).toBe("missing_entry");
    await rm(resolve(artifactRoot, ".."), { recursive: true, force: true });
  });

  it("rejects disallowed files", async () => {
    const artifactRoot = await copyFixture("minimal-valid-game");
    await writeFile(join(artifactRoot, "dist", "shell.html"), "<html></html>");
    const result = await validateArtifactDirectory(artifactRoot);
    expect(result.ok).toBe(false);
    expect(result.report.reason).toBe("disallowed_file_type");
    await rm(resolve(artifactRoot, ".."), { recursive: true, force: true });
  });

  it("stores smoke test status", async () => {
    const artifactRoot = await copyFixture("minimal-valid-game");
    const db = new InMemoryDatabase();
    const user = db.createUser({
      email: "dev@worker.test",
      username: "devworker",
      passwordHash: "hash",
      role: "developer"
    });
    const game = db.createGame({
      ownerUserId: user.id,
      slug: "worker-validated",
      title: "Worker Validated",
      shortDescription: "worker test game",
      description: "worker test game description",
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
      sourceArchiveStorageKey: artifactRoot,
      validationReportJson: null,
      smokeTestReportJson: null,
      moderationNotes: null
    });

    await processSubmission({
      db,
      versionId: version.id,
      submissionId: submission.id,
      artifactRoot
    });

    const updated = db.getVersion(version.id);
    expect(updated?.validationStatus).toBe("passed");
    expect(updated?.smokeTestStatus).toBe("passed");
    await rm(resolve(artifactRoot, ".."), { recursive: true, force: true });
  });
});
