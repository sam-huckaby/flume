import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["player", "developer", "moderator", "admin"]);
export const gameVisibilityEnum = pgEnum("game_visibility", ["draft", "public", "unlisted"]);
export const gameStatusEnum = pgEnum("game_status", ["draft", "active", "suspended"]);
export const reviewStateEnum = pgEnum("review_state", ["draft", "pending_review", "approved", "rejected"]);
export const publishStateEnum = pgEnum("publish_state", ["unpublished", "published", "revoked"]);
export const validationStateEnum = pgEnum("validation_status", ["pending", "passed", "failed"]);
export const smokeStateEnum = pgEnum("smoke_test_status", ["pending", "passed", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const developerProfiles = pgTable("developer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  shortDescription: varchar("short_description", { length: 250 }).notNull(),
  description: text("description").notNull(),
  genre: varchar("genre", { length: 80 }).notNull(),
  visibility: gameVisibilityEnum("visibility").notNull().default("draft"),
  status: gameStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const gameVersions = pgTable("game_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 64 }).notNull(),
  manifestJson: jsonb("manifest_json").notNull(),
  sdkVersion: varchar("sdk_version", { length: 40 }).notNull(),
  runtimeVersionRange: varchar("runtime_version_range", { length: 80 }).notNull(),
  artifactStorageKey: text("artifact_storage_key"),
  artifactHash: varchar("artifact_hash", { length: 128 }),
  reviewState: reviewStateEnum("review_state").notNull().default("draft"),
  publishState: publishStateEnum("publish_state").notNull().default("unpublished"),
  validationStatus: validationStateEnum("validation_status").notNull().default("pending"),
  smokeTestStatus: smokeStateEnum("smoke_test_status").notNull().default("pending"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameVersionId: uuid("game_version_id")
    .notNull()
    .references(() => gameVersions.id, { onDelete: "cascade" }),
  uploadedByUserId: uuid("uploaded_by_user_id")
    .notNull()
    .references(() => users.id),
  sourceArchiveStorageKey: text("source_archive_storage_key").notNull(),
  validationReportJson: jsonb("validation_report_json"),
  smokeTestReportJson: jsonb("smoke_test_report_json"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const playSessions = pgTable("play_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameVersionId: uuid("game_version_id")
    .notNull()
    .references(() => gameVersions.id, { onDelete: "cascade" }),
  playerUserId: uuid("player_user_id").references(() => users.id),
  runtimeVersion: varchar("runtime_version", { length: 32 }).notNull(),
  sessionTokenHash: text("session_token_hash").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  exitReason: varchar("exit_reason", { length: 80 }),
  telemetrySummaryJson: jsonb("telemetry_summary_json")
});

export const saveStates = pgTable("save_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerUserId: uuid("player_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  gameVersionId: uuid("game_version_id")
    .notNull()
    .references(() => gameVersions.id, { onDelete: "cascade" }),
  slotKey: varchar("slot_key", { length: 64 }).notNull(),
  stateJson: jsonb("state_json").notNull(),
  stateSizeBytes: integer("state_size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const scoreEntries = pgTable("score_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  gameVersionId: uuid("game_version_id")
    .notNull()
    .references(() => gameVersions.id, { onDelete: "cascade" }),
  playerUserId: uuid("player_user_id").references(() => users.id),
  score: bigint("score", { mode: "number" }).notNull(),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const abuseReports = pgTable("abuse_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterUserId: uuid("reporter_user_id")
    .notNull()
    .references(() => users.id),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 120 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 40 }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  games: many(games)
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  owner: one(users, {
    fields: [games.ownerUserId],
    references: [users.id]
  }),
  versions: many(gameVersions)
}));
