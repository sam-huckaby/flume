import { randomUUID } from "node:crypto";

export type ReviewState = "draft" | "pending_review" | "approved" | "rejected";
export type PublishState = "unpublished" | "published" | "revoked";
export type ValidationStatus = "pending" | "passed" | "failed";
export type SmokeTestStatus = "pending" | "passed" | "failed";
export type UserRole = "player" | "developer" | "moderator" | "admin";

export type UserRecord = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type GameRecord = {
  id: string;
  ownerUserId: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  genre: string;
  visibility: "draft" | "public" | "unlisted";
  status: "draft" | "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
};

export type GameVersionRecord = {
  id: string;
  gameId: string;
  version: string;
  manifestJson: Record<string, unknown>;
  sdkVersion: string;
  runtimeVersionRange: string;
  artifactStorageKey: string | null;
  artifactHash: string | null;
  reviewState: ReviewState;
  publishState: PublishState;
  validationStatus: ValidationStatus;
  smokeTestStatus: SmokeTestStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionRecord = {
  id: string;
  gameVersionId: string;
  uploadedByUserId: string;
  sourceArchiveStorageKey: string;
  validationReportJson: Record<string, unknown> | null;
  smokeTestReportJson: Record<string, unknown> | null;
  moderationNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlaySessionRecord = {
  id: string;
  gameVersionId: string;
  playerUserId: string | null;
  runtimeVersion: string;
  sessionTokenHash: string;
  startedAt: Date;
  endedAt: Date | null;
  exitReason: string | null;
  telemetrySummaryJson: Record<string, unknown> | null;
};

export type SaveStateRecord = {
  id: string;
  playerUserId: string;
  gameId: string;
  gameVersionId: string;
  slotKey: string;
  stateJson: Record<string, unknown>;
  stateSizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ScoreEntryRecord = {
  id: string;
  gameId: string;
  gameVersionId: string;
  playerUserId: string | null;
  score: number;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
};

function now(): Date {
  return new Date();
}

export function ensureReviewTransition(current: ReviewState, next: ReviewState): void {
  const allowed: Record<ReviewState, ReviewState[]> = {
    draft: ["pending_review"],
    pending_review: ["approved", "rejected"],
    approved: [],
    rejected: ["pending_review"]
  };
  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid review transition: ${current} -> ${next}`);
  }
}

export function ensurePublishTransition(
  reviewState: ReviewState,
  current: PublishState,
  next: PublishState
): void {
  const allowed: Record<PublishState, PublishState[]> = {
    unpublished: ["published"],
    published: ["revoked"],
    revoked: ["published"]
  };
  if (next === "published" && reviewState !== "approved") {
    throw new Error("Cannot publish non-approved version");
  }
  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid publish transition: ${current} -> ${next}`);
  }
}

export class InMemoryDatabase {
  users = new Map<string, UserRecord>();
  games = new Map<string, GameRecord>();
  gameVersions = new Map<string, GameVersionRecord>();
  submissions = new Map<string, SubmissionRecord>();
  playSessions = new Map<string, PlaySessionRecord>();
  saveStates = new Map<string, SaveStateRecord>();
  scores = new Map<string, ScoreEntryRecord>();

  createUser(input: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): UserRecord {
    const record: UserRecord = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.users.set(record.id, record);
    return record;
  }

  getUserByEmail(email: string): UserRecord | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  getUserById(userId: string): UserRecord | null {
    return this.users.get(userId) ?? null;
  }

  createGame(input: Omit<GameRecord, "id" | "createdAt" | "updatedAt">): GameRecord {
    const record: GameRecord = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.games.set(record.id, record);
    return record;
  }

  updateGame(gameId: string, updates: Partial<GameRecord>): GameRecord {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    const updated = { ...game, ...updates, updatedAt: now() };
    this.games.set(gameId, updated);
    return updated;
  }

  getGameBySlug(slug: string): GameRecord | null {
    for (const game of this.games.values()) {
      if (game.slug === slug) {
        return game;
      }
    }
    return null;
  }

  listGames(includeDrafts = false): GameRecord[] {
    return [...this.games.values()].filter((game) =>
      includeDrafts ? true : game.visibility === "public" && game.status === "active"
    );
  }

  createGameVersion(
    input: Omit<
      GameVersionRecord,
      "id" | "createdAt" | "updatedAt" | "artifactStorageKey" | "artifactHash" | "reviewState" | "publishState"
    > &
      Partial<Pick<GameVersionRecord, "artifactStorageKey" | "artifactHash" | "reviewState" | "publishState">>
  ): GameVersionRecord {
    const record: GameVersionRecord = {
      ...input,
      id: randomUUID(),
      createdAt: now(),
      updatedAt: now(),
      reviewState: input.reviewState ?? "draft",
      publishState: input.publishState ?? "unpublished",
      artifactStorageKey: input.artifactStorageKey ?? null,
      artifactHash: input.artifactHash ?? null
    };
    this.gameVersions.set(record.id, record);
    return record;
  }

  getVersion(versionId: string): GameVersionRecord | null {
    return this.gameVersions.get(versionId) ?? null;
  }

  listVersions(gameId: string): GameVersionRecord[] {
    return [...this.gameVersions.values()].filter((version) => version.gameId === gameId);
  }

  updateVersion(versionId: string, updates: Partial<GameVersionRecord>): GameVersionRecord {
    const version = this.gameVersions.get(versionId);
    if (!version) {
      throw new Error("Version not found");
    }
    const updated = { ...version, ...updates, updatedAt: now() };
    this.gameVersions.set(versionId, updated);
    return updated;
  }

  setReviewState(versionId: string, next: ReviewState): GameVersionRecord {
    const version = this.requireVersion(versionId);
    ensureReviewTransition(version.reviewState, next);
    return this.updateVersion(versionId, { reviewState: next });
  }

  setPublishState(versionId: string, next: PublishState): GameVersionRecord {
    const version = this.requireVersion(versionId);
    ensurePublishTransition(version.reviewState, version.publishState, next);
    return this.updateVersion(versionId, { publishState: next });
  }

  createSubmission(input: Omit<SubmissionRecord, "id" | "createdAt" | "updatedAt">): SubmissionRecord {
    const record: SubmissionRecord = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.submissions.set(record.id, record);
    return record;
  }

  createPlaySession(input: Omit<PlaySessionRecord, "id" | "startedAt" | "endedAt" | "exitReason">): PlaySessionRecord {
    const record: PlaySessionRecord = {
      ...input,
      id: randomUUID(),
      startedAt: now(),
      endedAt: null,
      exitReason: null
    };
    this.playSessions.set(record.id, record);
    return record;
  }

  endPlaySession(sessionId: string, exitReason: string, telemetrySummaryJson: Record<string, unknown> | null): PlaySessionRecord {
    const session = this.playSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    const updated = { ...session, endedAt: now(), exitReason, telemetrySummaryJson };
    this.playSessions.set(sessionId, updated);
    return updated;
  }

  upsertSaveState(input: Omit<SaveStateRecord, "id" | "createdAt" | "updatedAt">): SaveStateRecord {
    const existing = [...this.saveStates.values()].find(
      (save) =>
        save.playerUserId === input.playerUserId &&
        save.gameId === input.gameId &&
        save.gameVersionId === input.gameVersionId &&
        save.slotKey === input.slotKey
    );
    if (existing) {
      const updated: SaveStateRecord = { ...existing, ...input, updatedAt: now() };
      this.saveStates.set(existing.id, updated);
      return updated;
    }
    const record: SaveStateRecord = {
      ...input,
      id: randomUUID(),
      createdAt: now(),
      updatedAt: now()
    };
    this.saveStates.set(record.id, record);
    return record;
  }

  getSaveState(playerUserId: string, gameId: string, slotKey: string): SaveStateRecord | null {
    return (
      [...this.saveStates.values()].find(
        (save) => save.playerUserId === playerUserId && save.gameId === gameId && save.slotKey === slotKey
      ) ?? null
    );
  }

  insertScore(input: Omit<ScoreEntryRecord, "id" | "createdAt">): ScoreEntryRecord {
    const record: ScoreEntryRecord = { ...input, id: randomUUID(), createdAt: now() };
    this.scores.set(record.id, record);
    return record;
  }

  listScores(gameId: string): ScoreEntryRecord[] {
    return [...this.scores.values()]
      .filter((score) => score.gameId === gameId)
      .sort((a, b) => b.score - a.score);
  }

  private requireVersion(versionId: string): GameVersionRecord {
    const version = this.getVersion(versionId);
    if (!version) {
      throw new Error("Version not found");
    }
    return version;
  }
}
