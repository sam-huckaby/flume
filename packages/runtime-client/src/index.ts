import {
  gameManifestSchema,
  isManifestCompatibleWithRuntime,
  type GameDefinition,
  type GameInitContext,
  type GameManifest,
  type GamePermission,
  type GameViewport,
  type TelemetryEvent
} from "@ai-platform/runtime-contract";

const MAX_SAVE_STATE_BYTES = 64 * 1024;

export type SessionState = "created" | "initialized" | "running" | "paused" | "disposed" | "errored";

export type RuntimeApi = {
  saveState(gameId: string, slotKey: string, state: unknown): Promise<void>;
  loadState(gameId: string, slotKey: string): Promise<unknown | null>;
  submitScore(gameId: string, score: number, metadata?: Record<string, unknown>): Promise<void>;
  publishTelemetry(event: TelemetryEvent): void;
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
};

export function validateManifest(rawManifest: unknown): GameManifest {
  return gameManifestSchema.parse(rawManifest);
}

export async function loadManifestFromUrl(fetcher: typeof fetch, manifestUrl: string): Promise<GameManifest> {
  const response = await fetcher(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.status}`);
  }
  const manifest = await response.json();
  return validateManifest(manifest);
}

export async function loadGameEntry(
  loadModule: () => Promise<unknown>
): Promise<{ game: GameDefinition; manifest: GameManifest }> {
  const loaded = (await loadModule()) as { default?: unknown };
  if (!loaded.default || typeof loaded.default !== "object") {
    throw new Error("Game module must have object default export.");
  }

  const game = loaded.default as GameDefinition;
  if (!game.manifest || typeof game.init !== "function" || typeof game.start !== "function") {
    throw new Error("Game module default export does not match GameDefinition.");
  }

  const manifest = validateManifest(game.manifest);
  return { game, manifest };
}

type ContextFactoryInput = {
  manifest: GameManifest;
  runtimeApi: RuntimeApi;
  sessionId: string;
  runtimeVersion: string;
  canvas: HTMLCanvasElement | unknown;
  width: number;
  height: number;
};

function validateSaveStateSize(state: unknown): void {
  const serialized = JSON.stringify(state);
  if (!serialized) {
    throw new Error("state must be serializable JSON");
  }
  const size = new TextEncoder().encode(serialized).length;
  if (size > MAX_SAVE_STATE_BYTES) {
    throw new Error(`save state exceeds ${MAX_SAVE_STATE_BYTES} bytes`);
  }
}

function hasPermission(permissions: GamePermission[], permission: GamePermission): boolean {
  return permissions.includes(permission);
}

export function composeCapabilities(input: ContextFactoryInput): GameInitContext {
  const { manifest, runtimeApi, sessionId, runtimeVersion, canvas, width, height } = input;
  const listeners = {
    keyDown: new Set<(event: { key: string; repeat: boolean }) => void>(),
    keyUp: new Set<(event: { key: string; repeat: boolean }) => void>(),
    pointerDown: new Set<(event: { x: number; y: number; button: number }) => void>(),
    pointerUp: new Set<(event: { x: number; y: number; button: number }) => void>()
  };

  const ctx: GameInitContext = {
    runtime: {
      sessionId,
      runtimeVersion
    },
    render: {
      canvas,
      width,
      height
    },
    input: {
      onKeyDown(handler) {
        listeners.keyDown.add(handler);
        return () => listeners.keyDown.delete(handler);
      },
      onKeyUp(handler) {
        listeners.keyUp.add(handler);
        return () => listeners.keyUp.delete(handler);
      },
      onPointerDown(handler) {
        listeners.pointerDown.add(handler);
        return () => listeners.pointerDown.delete(handler);
      },
      onPointerUp(handler) {
        listeners.pointerUp.add(handler);
        return () => listeners.pointerUp.delete(handler);
      }
    },
    telemetry: {
      track(event, payload) {
        runtimeApi.publishTelemetry({
          name: "game_loaded",
          gameId: manifest.id,
          sessionId,
          timestamp: new Date().toISOString(),
          payload: { event, ...payload }
        });
      }
    },
    logger: runtimeApi.logger
  };

  if (hasPermission(manifest.permissions, "storage")) {
    ctx.storage = {
      async save(slotKey, state) {
        validateSaveStateSize(state);
        await runtimeApi.saveState(manifest.id, slotKey, state);
      },
      async load(slotKey) {
        return runtimeApi.loadState(manifest.id, slotKey);
      }
    };
  }

  if (hasPermission(manifest.permissions, "leaderboards")) {
    ctx.leaderboards = {
      async submitScore(score, metadata) {
        await runtimeApi.submitScore(manifest.id, score, metadata);
      }
    };
  }

  return ctx;
}

type CreateSessionInput = {
  game: GameDefinition;
  manifest: GameManifest;
  runtimeVersion: string;
  runtimeApi: RuntimeApi;
  canvas: HTMLCanvasElement | unknown;
  width: number;
  height: number;
  sessionId: string;
};

export class GameSessionController {
  private state: SessionState = "created";
  private readonly game: GameDefinition;
  private readonly manifest: GameManifest;
  private readonly runtimeVersion: string;
  private readonly runtimeApi: RuntimeApi;
  private readonly context: GameInitContext;
  private readonly sessionId: string;

  constructor(input: CreateSessionInput) {
    if (!isManifestCompatibleWithRuntime(input.manifest, input.runtimeVersion)) {
      throw new Error("Manifest is not compatible with runtime version.");
    }
    this.game = input.game;
    this.manifest = input.manifest;
    this.runtimeVersion = input.runtimeVersion;
    this.runtimeApi = input.runtimeApi;
    this.sessionId = input.sessionId;
    this.context = composeCapabilities({
      manifest: input.manifest,
      runtimeApi: input.runtimeApi,
      sessionId: input.sessionId,
      runtimeVersion: input.runtimeVersion,
      canvas: input.canvas,
      width: input.width,
      height: input.height
    });
  }

  getState(): SessionState {
    return this.state;
  }

  private ensureAllowedTransition(next: SessionState): void {
    const allowed: Record<SessionState, SessionState[]> = {
      created: ["initialized", "errored"],
      initialized: ["running", "errored"],
      running: ["paused", "disposed", "errored"],
      paused: ["running", "disposed", "errored"],
      disposed: [],
      errored: ["disposed"]
    };
    if (!allowed[this.state].includes(next)) {
      throw new Error(`Invalid lifecycle transition: ${this.state} -> ${next}`);
    }
  }

  private async handleStep(nextState: SessionState, operation: () => Promise<void> | void): Promise<void> {
    this.ensureAllowedTransition(nextState);
    try {
      await operation();
      this.state = nextState;
    } catch (error) {
      this.state = "errored";
      const message = error instanceof Error ? error.message : "unknown runtime error";
      this.runtimeApi.publishTelemetry({
        name: "game_runtime_error",
        gameId: this.manifest.id,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        payload: { message, state: this.state }
      });
      throw error;
    }
  }

  async initialize(): Promise<void> {
    await this.handleStep("initialized", async () => this.game.init(this.context));
  }

  async start(): Promise<void> {
    await this.handleStep("running", async () => this.game.start());
  }

  async pause(): Promise<void> {
    await this.handleStep("paused", async () => this.game.pause?.());
  }

  async resume(): Promise<void> {
    await this.handleStep("running", async () => this.game.resume?.());
  }

  async resize(viewport: GameViewport): Promise<void> {
    if (this.state !== "running" && this.state !== "paused") {
      throw new Error(`Resize requires running/paused state, got ${this.state}`);
    }
    await this.game.resize?.(viewport);
  }

  async dispose(): Promise<void> {
    if (this.state === "disposed") {
      return;
    }
    if (this.state === "errored") {
      this.ensureAllowedTransition("disposed");
    } else if (this.state !== "running" && this.state !== "paused") {
      throw new Error(`Dispose requires running/paused/errored state, got ${this.state}`);
    } else {
      this.ensureAllowedTransition("disposed");
    }
    await this.game.dispose?.();
    this.state = "disposed";
  }

  getManifest(): GameManifest {
    return this.manifest;
  }

  getRuntimeVersion(): string {
    return this.runtimeVersion;
  }
}

export function createGameSession(input: CreateSessionInput): GameSessionController {
  return new GameSessionController(input);
}

export async function startGameSession(controller: GameSessionController): Promise<void> {
  await controller.initialize();
  await controller.start();
}

export async function pauseGameSession(controller: GameSessionController): Promise<void> {
  await controller.pause();
}

export async function resumeGameSession(controller: GameSessionController): Promise<void> {
  await controller.resume();
}

export async function disposeGameSession(controller: GameSessionController): Promise<void> {
  await controller.dispose();
}
