import { describe, expect, it, expectTypeOf } from "vitest";
import { defineGame } from "../src/index.js";
import type { GameDefinition } from "@ai-platform/runtime-contract";

describe("defineGame", () => {
  it("returns the same object", () => {
    const game = defineGame({
      manifest: {
        id: "minimal-sdk-game",
        title: "Minimal SDK Game",
        version: "1.0.0",
        entry: "dist/main.js",
        sdkVersion: "1.0.0",
        minRuntimeVersion: "1.0.0",
        permissions: ["telemetry"],
        saveSchemaVersion: "1",
        input: { keyboard: true, pointer: false, gamepad: false },
        renderMode: "canvas",
        aiDisclosure: { isAIGenerated: true },
        contentRating: { violence: "none", language: "none" }
      },
      init() {},
      start() {}
    });

    expect(game.manifest.id).toBe("minimal-sdk-game");
  });

  it("preserves type information for lifecycle", () => {
    const game = defineGame({
      manifest: {
        id: "typed-sdk-game",
        title: "Typed SDK Game",
        version: "1.0.0",
        entry: "dist/main.js",
        sdkVersion: "1.0.0",
        minRuntimeVersion: "1.0.0",
        permissions: ["storage", "leaderboards", "telemetry"],
        saveSchemaVersion: "1",
        input: { keyboard: true, pointer: true, gamepad: false },
        renderMode: "canvas",
        aiDisclosure: { isAIGenerated: true, notes: "AI-generated prototype" },
        contentRating: { violence: "mild", language: "none" }
      },
      init(ctx) {
        ctx.telemetry.track("ready");
      },
      start() {}
    });

    expectTypeOf(game).toMatchTypeOf<GameDefinition>();
  });
});
