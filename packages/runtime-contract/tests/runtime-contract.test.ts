import { describe, expect, it } from "vitest";
import {
  bridgeMessageSchema,
  gameManifestSchema,
  isManifestCompatibleWithRuntime,
  isSdkCompatibleWithRuntime
} from "../src/index.js";

describe("gameManifestSchema", () => {
  const validManifest = {
    id: "space-blaster",
    title: "Space Blaster",
    version: "1.0.0",
    entry: "dist/main.js",
    sdkVersion: "1.0.0",
    minRuntimeVersion: "1.0.0",
    permissions: ["storage", "telemetry"],
    saveSchemaVersion: "1",
    input: {
      keyboard: true,
      pointer: true,
      gamepad: false
    },
    renderMode: "canvas",
    aiDisclosure: {
      isAIGenerated: true,
      notes: "Generated with assistant tooling."
    },
    contentRating: {
      violence: "mild",
      language: "none"
    }
  } as const;

  it("accepts a valid manifest", () => {
    const parsed = gameManifestSchema.parse(validManifest);
    expect(parsed.id).toBe("space-blaster");
  });

  it("rejects undeclared permissions", () => {
    const result = gameManifestSchema.safeParse({
      ...validManifest,
      permissions: ["storage", "network"]
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid entry path", () => {
    const result = gameManifestSchema.safeParse({
      ...validManifest,
      entry: "../index.html"
    });
    expect(result.success).toBe(false);
  });
});

describe("bridgeMessageSchema", () => {
  it("rejects malformed bridge messages", () => {
    const malformed = {
      type: "game.storage.save",
      slotKey: "autosave"
    };
    const result = bridgeMessageSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});

describe("version compatibility", () => {
  it("supports manifest runtime compatibility checks", () => {
    expect(isManifestCompatibleWithRuntime({ minRuntimeVersion: "1.2.0" }, "1.3.1")).toBe(true);
    expect(isManifestCompatibleWithRuntime({ minRuntimeVersion: "1.2.0" }, "1.1.9")).toBe(false);
  });

  it("supports sdk/runtime major compatibility checks", () => {
    expect(isSdkCompatibleWithRuntime("1.4.0", "1.9.9")).toBe(true);
    expect(isSdkCompatibleWithRuntime("2.0.0", "1.9.9")).toBe(false);
  });
});
