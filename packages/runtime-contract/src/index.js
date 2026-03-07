import { satisfies } from "semver";
import { z } from "zod";
export const gamePermissionSchema = z.enum(["storage", "leaderboards", "telemetry"]);
export const gameContentRatingSchema = z.object({
    violence: z.enum(["none", "mild", "moderate"]),
    language: z.enum(["none", "mild", "moderate"])
});
export const gameAIDisclosureSchema = z.object({
    isAIGenerated: z.boolean(),
    notes: z.string().max(500).optional()
});
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
export function isManifestCompatibleWithRuntime(manifest, runtimeVersion) {
    return satisfies(runtimeVersion, `>=${manifest.minRuntimeVersion}`, { includePrerelease: true });
}
export function isSdkCompatibleWithRuntime(sdkVersion, runtimeVersion) {
    const sdkMajor = sdkVersion.split(".")[0];
    const runtimeMajor = runtimeVersion.split(".")[0];
    return sdkMajor === runtimeMajor;
}
//# sourceMappingURL=index.js.map