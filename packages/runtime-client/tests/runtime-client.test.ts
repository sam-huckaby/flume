import { describe, expect, it, vi } from "vitest";
import {
  composeCapabilities,
  createGameSession,
  loadManifestFromUrl,
  loadGameEntry,
  startGameSession
} from "../src/index.js";
import type { GameDefinition, GameManifest, TelemetryEvent } from "@ai-platform/runtime-contract";

function createManifest(permissions: GameManifest["permissions"]): GameManifest {
  return {
    id: "fixture-game",
    title: "Fixture Game",
    version: "1.0.0",
    entry: "dist/main.js",
    sdkVersion: "1.0.0",
    minRuntimeVersion: "1.0.0",
    permissions,
    saveSchemaVersion: "1",
    input: { keyboard: true, pointer: true, gamepad: false },
    renderMode: "canvas",
    aiDisclosure: { isAIGenerated: true },
    contentRating: { violence: "none", language: "none" }
  };
}

describe("loadGameEntry", () => {
  it("loads and validates manifest from URL", async () => {
    const manifest = createManifest(["telemetry"]);
    const loaded = await loadManifestFromUrl(
      vi.fn(async () => ({
        ok: true,
        json: async () => manifest
      })) as unknown as typeof fetch,
      "http://example/manifest.json"
    );
    expect(loaded.id).toBe(manifest.id);
  });

  it("loads valid game module export", async () => {
    const manifest = createManifest(["telemetry"]);
    const result = await loadGameEntry(async () => ({
      default: {
        manifest,
        init() {},
        start() {}
      } satisfies GameDefinition
    }));
    expect(result.manifest.id).toBe("fixture-game");
  });

  it("rejects invalid default export", async () => {
    await expect(loadGameEntry(async () => ({ default: () => {} }))).rejects.toThrow(
      /must have object default export/i
    );
  });
});

describe("composeCapabilities", () => {
  it("exposes only permissioned capabilities", async () => {
    const saveState = vi.fn(async () => {});
    const submitScore = vi.fn(async () => {});
    const context = composeCapabilities({
      manifest: createManifest(["storage"]),
      sessionId: "s1",
      runtimeVersion: "1.0.0",
      canvas: {},
      width: 800,
      height: 600,
      runtimeApi: {
        saveState,
        loadState: async () => ({ hp: 10 }),
        submitScore,
        publishTelemetry: () => {},
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    });

    expect(context.storage).toBeDefined();
    expect(context.leaderboards).toBeUndefined();
    await context.storage?.save("autosave", { hp: 10 });
    expect(saveState).toHaveBeenCalledOnce();
    expect(submitScore).not.toHaveBeenCalled();
  });

  it("rejects oversized save state payloads", async () => {
    const context = composeCapabilities({
      manifest: createManifest(["storage"]),
      sessionId: "s1",
      runtimeVersion: "1.0.0",
      canvas: {},
      width: 800,
      height: 600,
      runtimeApi: {
        saveState: async () => {},
        loadState: async () => null,
        submitScore: async () => {},
        publishTelemetry: () => {},
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    });
    const huge = { data: "x".repeat(70 * 1024) };
    await expect(context.storage?.save("slot-1", huge)).rejects.toThrow(/exceeds/i);
  });
});

describe("GameSessionController lifecycle", () => {
  it("enforces valid lifecycle ordering", async () => {
    const game: GameDefinition = {
      manifest: createManifest(["telemetry"]),
      init: vi.fn(),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      dispose: vi.fn()
    };

    const controller = createGameSession({
      game,
      manifest: game.manifest,
      runtimeVersion: "1.0.0",
      sessionId: "session-1",
      canvas: {},
      width: 320,
      height: 200,
      runtimeApi: {
        saveState: async () => {},
        loadState: async () => null,
        submitScore: async () => {},
        publishTelemetry: () => {},
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    });

    await startGameSession(controller);
    expect(controller.getState()).toBe("running");
    await controller.pause();
    expect(controller.getState()).toBe("paused");
    await controller.resume();
    await controller.dispose();
    expect(controller.getState()).toBe("disposed");
  });

  it("captures runtime errors and moves into errored state", async () => {
    const telemetry: TelemetryEvent[] = [];
    const game: GameDefinition = {
      manifest: createManifest(["telemetry"]),
      init() {
        throw new Error("boom");
      },
      start() {}
    };
    const controller = createGameSession({
      game,
      manifest: game.manifest,
      runtimeVersion: "1.0.0",
      sessionId: "session-err",
      canvas: {},
      width: 320,
      height: 200,
      runtimeApi: {
        saveState: async () => {},
        loadState: async () => null,
        submitScore: async () => {},
        publishTelemetry: (event) => telemetry.push(event),
        logger: { info: () => {}, warn: () => {}, error: () => {} }
      }
    });

    await expect(controller.initialize()).rejects.toThrow("boom");
    expect(controller.getState()).toBe("errored");
    expect(telemetry.some((event) => event.name === "game_runtime_error")).toBe(true);
  });
});
