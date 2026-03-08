import { afterEach, describe, expect, it, vi } from "vitest";
import { bootstrapRuntime } from "../src/runtime.js";

const baseManifest = {
  id: "runtime-test-game",
  title: "Runtime Test Game",
  version: "1.0.0",
  entry: "dist/main.js",
  sdkVersion: "1.0.0",
  minRuntimeVersion: "1.0.0",
  permissions: ["telemetry"],
  saveSchemaVersion: "1",
  input: { keyboard: true, pointer: true, gamepad: false },
  renderMode: "canvas",
  aiDisclosure: { isAIGenerated: true },
  contentRating: { violence: "none", language: "none" }
};

function createBootstrap() {
  return {
    sessionId: "session-1",
    sessionToken: "token-1",
    artifactBaseUrl: "http://play.local/artifact",
    apiBaseUrl: "http://api.local",
    runtimeVersion: "1.0.0"
  };
}

describe("runtime host bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("boots with valid session and game", async () => {
    const mount = document.createElement("div");
    Object.defineProperty(mount, "clientWidth", { value: 400 });
    Object.defineProperty(mount, "clientHeight", { value: 300 });
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/manifest.json")) {
        return {
          ok: true,
          json: async () => baseManifest
        } as Response;
      }
      return { ok: true, json: async () => ({ accepted: true }) } as Response;
    });
    const resize = vi.fn();
    const runtime = await bootstrapRuntime(createBootstrap(), mount, {
      fetchFn: fetchFn as unknown as typeof fetch,
      importModule: async () => ({
        default: {
          manifest: baseManifest,
          init() {},
          start() {},
          resize,
          dispose() {}
        }
      })
    });
    expect(runtime.controller.getState()).toBe("running");
    await runtime.dispose();
    expect(runtime.controller.getState()).toBe("disposed");
  });

  it("rejects incompatible manifest", async () => {
    const mount = document.createElement("div");
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...baseManifest, minRuntimeVersion: "9.0.0" })
    }));
    await expect(
      bootstrapRuntime(createBootstrap(), mount, {
        fetchFn: fetchFn as unknown as typeof fetch,
        importModule: async () => ({ default: {} })
      })
    ).rejects.toThrow(/incompatible runtime/i);
  });

  it("handles game exception gracefully", async () => {
    const mount = document.createElement("div");
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/manifest.json")) {
        return {
          ok: true,
          json: async () => baseManifest
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
    await expect(
      bootstrapRuntime(createBootstrap(), mount, {
        fetchFn: fetchFn as unknown as typeof fetch,
        importModule: async () => ({
          default: {
            manifest: baseManifest,
            init() {
              throw new Error("init failed");
            },
            start() {}
          }
        })
      })
    ).rejects.toThrow("init failed");
  });

  it("propagates resize events", async () => {
    const mount = document.createElement("div");
    Object.defineProperty(mount, "clientWidth", { value: 640 });
    Object.defineProperty(mount, "clientHeight", { value: 480 });
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/manifest.json")) {
        return {
          ok: true,
          json: async () => baseManifest
        } as Response;
      }
      return { ok: true, json: async () => ({ accepted: true }) } as Response;
    });
    const resize = vi.fn();
    const runtime = await bootstrapRuntime(createBootstrap(), mount, {
      fetchFn: fetchFn as unknown as typeof fetch,
      importModule: async () => ({
        default: {
          manifest: baseManifest,
          init() {},
          start() {},
          resize,
          dispose() {}
        }
      })
    });
    window.dispatchEvent(new Event("resize"));
    expect(resize).toHaveBeenCalled();
    await runtime.dispose();
  });

  it("treats telemetry transport failures as non-fatal", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mount = document.createElement("div");
    Object.defineProperty(mount, "clientWidth", { value: 320 });
    Object.defineProperty(mount, "clientHeight", { value: 240 });
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/telemetry/events")) {
        throw new Error("network down");
      }
      if (url.endsWith("/manifest.json")) {
        return {
          ok: true,
          json: async () => baseManifest
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    const runtime = await bootstrapRuntime(createBootstrap(), mount, {
      fetchFn: fetchFn as unknown as typeof fetch,
      importModule: async () => ({
        default: {
          manifest: baseManifest,
          init() {},
          start() {},
          dispose() {}
        }
      })
    });

    expect(runtime.controller.getState()).toBe("running");
    await runtime.dispose();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("fails when manifest fetch returns not found", async () => {
    const mount = document.createElement("div");
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/manifest.json")) {
        return {
          ok: false,
          status: 404
        } as Response;
      }
      return { ok: true, json: async () => ({ accepted: true }) } as Response;
    });

    await expect(
      bootstrapRuntime(createBootstrap(), mount, {
        fetchFn: fetchFn as unknown as typeof fetch,
        importModule: async () => ({ default: {} })
      })
    ).rejects.toThrow(/failed to fetch manifest \(404\)/i);
  });
});
