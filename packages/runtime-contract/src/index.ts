import { satisfies } from "semver";
import { z } from "zod";

export const gamePermissionSchema = z.enum(["storage", "leaderboards", "telemetry"]);
export type GamePermission = z.infer<typeof gamePermissionSchema>;

export const gameContentRatingSchema = z.object({
  violence: z.enum(["none", "mild", "moderate"]),
  language: z.enum(["none", "mild", "moderate"])
});
export type GameContentRating = z.infer<typeof gameContentRatingSchema>;

export const gameAIDisclosureSchema = z.object({
  isAIGenerated: z.boolean(),
  notes: z.string().max(500).optional()
});
export type GameAIDisclosure = z.infer<typeof gameAIDisclosureSchema>;

const inputSchema = z.object({
  keyboard: z.boolean(),
  pointer: z.boolean(),
  gamepad: z.boolean()
});

const entryPathSchema = z
  .string()
  .regex(/^dist\/[a-zA-Z0-9/_-]+\.js$/, "entry must be a JS file in dist/")
  .refine((path) => !path.includes(".."), "entry path traversal is not allowed");

export const gameManifestSchema = z.object({
  id: z.string().min(3).max(80),
  title: z.string().min(1).max(120),
  version: z.string().min(1),
  entry: entryPathSchema,
  sdkVersion: z.string().min(1),
  minRuntimeVersion: z.string().min(1),
  permissions: z.array(gamePermissionSchema).default([]),
  saveSchemaVersion: z.string().min(1),
  input: inputSchema,
  renderMode: z.literal("canvas"),
  aiDisclosure: gameAIDisclosureSchema,
  contentRating: gameContentRatingSchema
});
export type GameManifest = z.infer<typeof gameManifestSchema>;

export type RuntimeCompatibility = {
  runtimeVersion: string;
  sdkVersion: string;
};

export type GameViewport = {
  width: number;
  height: number;
  devicePixelRatio: number;
};

export type GameStartOptions = {
  resumedFromSave?: boolean;
  levelId?: string;
};

export type KeyEvent = {
  key: string;
  repeat: boolean;
};

export type PointerEvent = {
  x: number;
  y: number;
  button: number;
};

export type Unsubscribe = () => void;

export type GameInitContext = {
  runtime: {
    sessionId: string;
    runtimeVersion: string;
  };
  render: {
    canvas: HTMLCanvasElement | unknown;
    width: number;
    height: number;
  };
  input: {
    onKeyDown(handler: (event: KeyEvent) => void): Unsubscribe;
    onKeyUp(handler: (event: KeyEvent) => void): Unsubscribe;
    onPointerDown(handler: (event: PointerEvent) => void): Unsubscribe;
    onPointerUp(handler: (event: PointerEvent) => void): Unsubscribe;
  };
  storage?: {
    save(slotKey: string, state: unknown): Promise<void>;
    load(slotKey: string): Promise<unknown | null>;
  };
  leaderboards?: {
    submitScore(score: number, metadata?: Record<string, unknown>): Promise<void>;
  };
  telemetry: {
    track(event: string, payload?: Record<string, unknown>): void;
  };
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
};

export interface GameLifecycle {
  init(ctx: GameInitContext): Promise<void> | void;
  start(options?: GameStartOptions): Promise<void> | void;
  pause?(): Promise<void> | void;
  resume?(): Promise<void> | void;
  resize?(viewport: GameViewport): Promise<void> | void;
  dispose?(): Promise<void> | void;
}

export interface GameDefinition extends GameLifecycle {
  manifest: GameManifest;
}

const telemetryEventNameSchema = z.enum([
  "session_started",
  "session_ended",
  "game_loaded",
  "game_load_failed",
  "game_runtime_error",
  "save_requested",
  "save_failed",
  "score_submitted",
  "score_failed"
]);

export const telemetryEventSchema = z.object({
  name: telemetryEventNameSchema,
  sessionId: z.string().min(1),
  gameId: z.string().min(1),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()).optional()
});
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

const parentToRuntimeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("runtime.bootstrap"),
    sessionId: z.string().min(1),
    sessionToken: z.string().min(1),
    artifactBaseUrl: z.string().url(),
    apiBaseUrl: z.string().url()
  }),
  z.object({ type: z.literal("runtime.pause") }),
  z.object({ type: z.literal("runtime.resume") }),
  z.object({ type: z.literal("runtime.dispose") })
]);

const runtimeToParentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("runtime.ready"), sessionId: z.string().min(1) }),
  z.object({
    type: z.literal("runtime.error"),
    sessionId: z.string().min(1),
    message: z.string().min(1)
  }),
  z.object({
    type: z.literal("runtime.telemetry"),
    event: telemetryEventSchema
  })
]);

const gameToRuntimeRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("game.storage.save"),
    requestId: z.string().min(1),
    slotKey: z.string().min(1),
    state: z.unknown()
  }),
  z.object({
    type: z.literal("game.storage.load"),
    requestId: z.string().min(1),
    slotKey: z.string().min(1)
  }),
  z.object({
    type: z.literal("game.leaderboards.submitScore"),
    requestId: z.string().min(1),
    score: z.number(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }),
  z.object({
    type: z.literal("game.telemetry.track"),
    requestId: z.string().min(1),
    event: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).optional()
  })
]);

const runtimeToGameResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("runtime.response.ok"),
    requestId: z.string().min(1),
    data: z.unknown().optional()
  }),
  z.object({
    type: z.literal("runtime.response.error"),
    requestId: z.string().min(1),
    error: z.string().min(1)
  })
]);

export const bridgeMessageSchema = z.union([
  parentToRuntimeSchema,
  runtimeToParentSchema,
  gameToRuntimeRequestSchema,
  runtimeToGameResponseSchema
]);

export type BridgeMessage = z.infer<typeof bridgeMessageSchema>;

export function isManifestCompatibleWithRuntime(
  manifest: Pick<GameManifest, "minRuntimeVersion">,
  runtimeVersion: string
): boolean {
  return satisfies(runtimeVersion, `>=${manifest.minRuntimeVersion}`, { includePrerelease: true });
}

export function isSdkCompatibleWithRuntime(sdkVersion: string, runtimeVersion: string): boolean {
  const sdkMajor = sdkVersion.split(".")[0];
  const runtimeMajor = runtimeVersion.split(".")[0];
  return sdkMajor === runtimeMajor;
}
