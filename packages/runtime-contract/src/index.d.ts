import { z } from "zod";
export declare const gamePermissionSchema: z.ZodEnum<{
    storage: "storage";
    leaderboards: "leaderboards";
    telemetry: "telemetry";
}>;
export type GamePermission = z.infer<typeof gamePermissionSchema>;
export declare const gameContentRatingSchema: z.ZodObject<{
    violence: z.ZodEnum<{
        none: "none";
        mild: "mild";
        moderate: "moderate";
    }>;
    language: z.ZodEnum<{
        none: "none";
        mild: "mild";
        moderate: "moderate";
    }>;
}, z.core.$strip>;
export type GameContentRating = z.infer<typeof gameContentRatingSchema>;
export declare const gameAIDisclosureSchema: z.ZodObject<{
    isAIGenerated: z.ZodBoolean;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GameAIDisclosure = z.infer<typeof gameAIDisclosureSchema>;
export declare const gameManifestSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    version: z.ZodString;
    entry: z.ZodString;
    sdkVersion: z.ZodString;
    minRuntimeVersion: z.ZodString;
    permissions: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        storage: "storage";
        leaderboards: "leaderboards";
        telemetry: "telemetry";
    }>>>;
    saveSchemaVersion: z.ZodString;
    input: z.ZodObject<{
        keyboard: z.ZodBoolean;
        pointer: z.ZodBoolean;
        gamepad: z.ZodBoolean;
    }, z.core.$strip>;
    renderMode: z.ZodLiteral<"canvas">;
    aiDisclosure: z.ZodObject<{
        isAIGenerated: z.ZodBoolean;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    contentRating: z.ZodObject<{
        violence: z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
        }>;
        language: z.ZodEnum<{
            none: "none";
            mild: "mild";
            moderate: "moderate";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
export declare const telemetryEventSchema: z.ZodObject<{
    name: z.ZodEnum<{
        session_started: "session_started";
        session_ended: "session_ended";
        game_loaded: "game_loaded";
        game_load_failed: "game_load_failed";
        game_runtime_error: "game_runtime_error";
        save_requested: "save_requested";
        save_failed: "save_failed";
        score_submitted: "score_submitted";
        score_failed: "score_failed";
    }>;
    sessionId: z.ZodString;
    gameId: z.ZodString;
    timestamp: z.ZodString;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
export declare const bridgeMessageSchema: z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"runtime.bootstrap">;
    sessionId: z.ZodString;
    sessionToken: z.ZodString;
    artifactBaseUrl: z.ZodString;
    apiBaseUrl: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.pause">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.resume">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.dispose">;
}, z.core.$strip>], "type">, z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"runtime.ready">;
    sessionId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.error">;
    sessionId: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.telemetry">;
    event: z.ZodObject<{
        name: z.ZodEnum<{
            session_started: "session_started";
            session_ended: "session_ended";
            game_loaded: "game_loaded";
            game_load_failed: "game_load_failed";
            game_runtime_error: "game_runtime_error";
            save_requested: "save_requested";
            save_failed: "save_failed";
            score_submitted: "score_submitted";
            score_failed: "score_failed";
        }>;
        sessionId: z.ZodString;
        gameId: z.ZodString;
        timestamp: z.ZodString;
        payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
}, z.core.$strip>], "type">, z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"game.storage.save">;
    requestId: z.ZodString;
    slotKey: z.ZodString;
    state: z.ZodUnknown;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"game.storage.load">;
    requestId: z.ZodString;
    slotKey: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"game.leaderboards.submitScore">;
    requestId: z.ZodString;
    score: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"game.telemetry.track">;
    requestId: z.ZodString;
    event: z.ZodString;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>], "type">, z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"runtime.response.ok">;
    requestId: z.ZodString;
    data: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"runtime.response.error">;
    requestId: z.ZodString;
    error: z.ZodString;
}, z.core.$strip>], "type">]>;
export type BridgeMessage = z.infer<typeof bridgeMessageSchema>;
export declare function isManifestCompatibleWithRuntime(manifest: Pick<GameManifest, "minRuntimeVersion">, runtimeVersion: string): boolean;
export declare function isSdkCompatibleWithRuntime(sdkVersion: string, runtimeVersion: string): boolean;
//# sourceMappingURL=index.d.ts.map