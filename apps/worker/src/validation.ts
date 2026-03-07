import { lstat, readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { InMemoryDatabase } from "@ai-platform/database";
import { createGameSession, loadGameEntry, startGameSession } from "@ai-platform/runtime-client";
import { gameManifestSchema, type GameManifest } from "@ai-platform/runtime-contract";

const ALLOWED_EXTENSIONS = new Set([
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp3",
  ".wav",
  ".txt"
]);

const MAX_FILE_COUNT = 200;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const MAX_ASSET_SIZE = 5 * 1024 * 1024;

export type ValidationResult = {
  ok: boolean;
  manifest?: GameManifest;
  entryPath?: string;
  artifactHash?: string;
  report: Record<string, unknown>;
};

type WalkResult = {
  files: string[];
  totalSize: number;
};

async function walkArtifact(rootDir: string, currentDir = rootDir, acc: WalkResult = { files: [], totalSize: 0 }): Promise<WalkResult> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = join(currentDir, entry.name);
    const relPath = relative(rootDir, absPath);
    const resolved = resolve(absPath);
    if (!resolved.startsWith(resolve(rootDir))) {
      throw new Error("Path traversal detected");
    }
    const stats = await lstat(absPath);
    if (stats.isSymbolicLink()) {
      throw new Error("Symlinks are not allowed");
    }
    if (entry.isDirectory()) {
      await walkArtifact(rootDir, absPath, acc);
      continue;
    }
    acc.files.push(relPath);
    acc.totalSize += stats.size;
  }
  return acc;
}

export async function validateArtifactDirectory(artifactRoot: string): Promise<ValidationResult> {
  try {
    const { files, totalSize } = await walkArtifact(artifactRoot);
    if (!files.includes("manifest.json")) {
      return {
        ok: false,
        report: { reason: "missing_manifest" }
      };
    }
    if (files.length > MAX_FILE_COUNT) {
      return {
        ok: false,
        report: { reason: "too_many_files", fileCount: files.length }
      };
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        ok: false,
        report: { reason: "archive_too_large", totalSize }
      };
    }

    for (const file of files) {
      const extension = extname(file);
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return { ok: false, report: { reason: "disallowed_file_type", file } };
      }
      if (file.toLowerCase().endsWith(".html")) {
        return { ok: false, report: { reason: "html_entrypoint_not_allowed", file } };
      }
      if (file.startsWith("assets/")) {
        const stats = await lstat(join(artifactRoot, file));
        if (stats.size > MAX_ASSET_SIZE) {
          return { ok: false, report: { reason: "asset_too_large", file, size: stats.size } };
        }
      }
    }

    const manifestRaw = JSON.parse(await readFile(join(artifactRoot, "manifest.json"), "utf8"));
    const manifest = gameManifestSchema.parse(manifestRaw);
    const entryPath = join(artifactRoot, manifest.entry);
    const entryStats = await lstat(entryPath).catch(() => null);
    if (!entryStats || !entryStats.isFile()) {
      return {
        ok: false,
        report: { reason: "missing_entry", entry: manifest.entry }
      };
    }

    const hash = createHash("sha256");
    for (const file of files.sort()) {
      const bytes = await readFile(join(artifactRoot, file));
      hash.update(file);
      hash.update(bytes);
    }

    return {
      ok: true,
      manifest,
      entryPath,
      artifactHash: hash.digest("hex"),
      report: { status: "passed", fileCount: files.length, totalSize }
    };
  } catch (error) {
    return {
      ok: false,
      report: {
        reason: "validation_exception",
        message: error instanceof Error ? error.message : "unknown"
      }
    };
  }
}

export async function smokeTestArtifact(
  artifactRoot: string,
  manifest: GameManifest,
  entryPath: string
): Promise<{ ok: boolean; report: Record<string, unknown> }> {
  try {
    const entryCode = await readFile(entryPath, "utf8");
    if (entryCode.includes("while (true)")) {
      return {
        ok: false,
        report: { reason: "runaway_loop_detected" }
      };
    }

    let telemetryCount = 0;
    const moduleUrl = pathToFileURL(entryPath).toString();
    const { game } = await loadGameEntry(async () => import(moduleUrl));
    const session = createGameSession({
      game,
      manifest,
      runtimeVersion: "1.0.0",
      sessionId: "smoke-test-session",
      canvas: {},
      width: 320,
      height: 200,
      runtimeApi: {
        saveState: async () => {},
        loadState: async () => null,
        submitScore: async () => {},
        publishTelemetry: () => {
          telemetryCount += 1;
          if (telemetryCount > 200) {
            throw new Error("telemetry_spam_detected");
          }
        },
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    });
    await startGameSession(session);
    await session.dispose();
    return {
      ok: true,
      report: { status: "passed" }
    };
  } catch (error) {
    return {
      ok: false,
      report: {
        reason: "smoke_test_exception",
        message: error instanceof Error ? error.message : "unknown"
      }
    };
  }
}

export async function processSubmission(params: {
  db: InMemoryDatabase;
  versionId: string;
  submissionId: string;
  artifactRoot: string;
}): Promise<void> {
  const validation = await validateArtifactDirectory(params.artifactRoot);
  if (!validation.ok) {
    params.db.updateVersion(params.versionId, {
      validationStatus: "failed",
      smokeTestStatus: "failed"
    });
    const submission = params.db.submissions.get(params.submissionId);
    if (submission) {
      params.db.submissions.set(params.submissionId, {
        ...submission,
        validationReportJson: validation.report
      });
    }
    return;
  }

  const smoke = await smokeTestArtifact(params.artifactRoot, validation.manifest!, validation.entryPath!);
  params.db.updateVersion(params.versionId, {
    artifactHash: validation.artifactHash!,
    validationStatus: "passed",
    smokeTestStatus: smoke.ok ? "passed" : "failed",
    manifestJson: validation.manifest as unknown as Record<string, unknown>
  });
  const submission = params.db.submissions.get(params.submissionId);
  if (submission) {
    params.db.submissions.set(params.submissionId, {
      ...submission,
      validationReportJson: validation.report,
      smokeTestReportJson: smoke.report
    });
  }
}
