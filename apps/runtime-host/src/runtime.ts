import {
  createGameSession,
  loadGameEntry,
  type GameSessionController,
  validateManifest
} from "@ai-platform/runtime-client";
import { isManifestCompatibleWithRuntime, type TelemetryEvent } from "@ai-platform/runtime-contract";

export type RuntimeBootstrap = {
  sessionId: string;
  sessionToken: string;
  artifactBaseUrl: string;
  apiBaseUrl: string;
  runtimeVersion: string;
};

type RuntimeDeps = {
  fetchFn?: typeof fetch;
  importModule?: (url: string) => Promise<unknown>;
};

export type RuntimeHandle = {
  controller: GameSessionController;
  dispose: () => Promise<void>;
};

function postParent(message: unknown): void {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, "*");
  }
}

export async function bootstrapRuntime(
  bootstrap: RuntimeBootstrap,
  mountNode: HTMLElement,
  deps?: RuntimeDeps
): Promise<RuntimeHandle> {
  const fetchFn = deps?.fetchFn ?? fetch;
  const importModule =
    deps?.importModule ??
    (async (url: string) => {
      return import(/* @vite-ignore */ url);
    });

  const publishTelemetry = async (event: TelemetryEvent): Promise<void> => {
    try {
      const response = await fetchFn(`${bootstrap.apiBaseUrl}/telemetry/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": bootstrap.sessionToken
        },
        body: JSON.stringify(event)
      });
      if (!response.ok) {
        console.warn("[runtime] telemetry delivery failed", { event: event.name, status: response.status });
      }
    } catch (error) {
      console.warn("[runtime] telemetry delivery failed", {
        event: event.name,
        message: error instanceof Error ? error.message : "unknown"
      });
    }
  };

  const emit = (name: TelemetryEvent["name"], payload?: Record<string, unknown>) => {
    void publishTelemetry({
      name,
      gameId: "unknown",
      sessionId: bootstrap.sessionId,
      timestamp: new Date().toISOString(),
      payload
    });
  };

  emit("session_started", { runtimeVersion: bootstrap.runtimeVersion });

  try {
    mountNode.innerHTML = "";
    const statusNode = document.createElement("div");
    statusNode.textContent = "Loading game...";
    mountNode.appendChild(statusNode);

    const manifestResponse = await fetchFn(`${bootstrap.artifactBaseUrl}/manifest.json`);
    if (!manifestResponse.ok) {
      throw new Error(`Failed to fetch manifest (${manifestResponse.status})`);
    }
    const manifestRaw = await manifestResponse.json();
    const manifest = validateManifest(manifestRaw);
    if (!isManifestCompatibleWithRuntime(manifest, bootstrap.runtimeVersion)) {
      throw new Error("Incompatible runtime version");
    }

    const gameId = manifest.id;
    const entryUrl = `${bootstrap.artifactBaseUrl}/${manifest.entry}`;
    const { game } = await loadGameEntry(async () => importModule(entryUrl));
    const canvas = document.createElement("canvas");
    canvas.width = mountNode.clientWidth || 800;
    canvas.height = mountNode.clientHeight || 600;
    statusNode.remove();
    mountNode.appendChild(canvas);

    const controller = createGameSession({
      game,
      manifest,
      runtimeVersion: bootstrap.runtimeVersion,
      sessionId: bootstrap.sessionId,
      canvas,
      width: canvas.width,
      height: canvas.height,
      runtimeApi: {
        async saveState(gameKey, slotKey, state) {
          emit("save_requested", { gameKey, slotKey });
          const response = await fetchFn(`${bootstrap.apiBaseUrl}/games/${gameKey}/saves/${slotKey}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": bootstrap.sessionToken
            },
            body: JSON.stringify({
              gameVersionId: manifest.version,
              state
            })
          });
          if (!response.ok) {
            emit("save_failed", { status: response.status });
            throw new Error("Save failed");
          }
        },
        async loadState(gameKey, slotKey) {
          const response = await fetchFn(`${bootstrap.apiBaseUrl}/games/${gameKey}/saves/${slotKey}`, {
            headers: {
              "x-session-token": bootstrap.sessionToken
            }
          });
          if (!response.ok) {
            return null;
          }
          const json = (await response.json()) as { save: { stateJson: unknown } };
          return json.save.stateJson ?? null;
        },
        async submitScore(gameKey, score, metadata) {
          const response = await fetchFn(`${bootstrap.apiBaseUrl}/games/${gameKey}/scores`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": bootstrap.sessionToken
            },
            body: JSON.stringify({
              gameVersionId: manifest.version,
              score,
              metadata
            })
          });
          if (!response.ok) {
            emit("score_failed", { status: response.status });
            throw new Error("Score submit failed");
          }
          emit("score_submitted", { score });
        },
        publishTelemetry(event) {
          void publishTelemetry({ ...event, gameId });
        },
        logger: {
          info(message, meta) {
            console.info("[runtime]", message, meta ?? {});
          },
          warn(message, meta) {
            console.warn("[runtime]", message, meta ?? {});
          },
          error(message, meta) {
            console.error("[runtime]", message, meta ?? {});
          }
        }
      }
    });

    await controller.initialize();
    await controller.start();
    emit("game_loaded", { gameId });
    postParent({ type: "runtime.ready", sessionId: bootstrap.sessionId });

    const onResize = async () => {
      canvas.width = mountNode.clientWidth || canvas.width;
      canvas.height = mountNode.clientHeight || canvas.height;
      if (controller.getState() !== "running" && controller.getState() !== "paused") {
        return;
      }
      await controller.resize({
        width: canvas.width,
        height: canvas.height,
        devicePixelRatio: window.devicePixelRatio || 1
      });
    };
    const onVisibility = async () => {
      if (document.visibilityState === "hidden" && controller.getState() === "running") {
        await controller.pause();
      } else if (document.visibilityState === "visible" && controller.getState() === "paused") {
        await controller.resume();
      }
    };
    const onResizeEvent = () => void onResize();
    const onVisibilityEvent = () => void onVisibility();
    window.addEventListener("resize", onResizeEvent);
    document.addEventListener("visibilitychange", onVisibilityEvent);

    return {
      controller,
      dispose: async () => {
        window.removeEventListener("resize", onResizeEvent);
        document.removeEventListener("visibilitychange", onVisibilityEvent);
        await controller.dispose();
        emit("session_ended", { reason: "runtime_disposed" });
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown runtime boot failure";
    emit("game_load_failed", { message });
    postParent({ type: "runtime.error", sessionId: bootstrap.sessionId, message });
    throw error;
  }
}

export function readBootstrapFromUrl(location: URL = new URL(window.location.href)): RuntimeBootstrap {
  return {
    sessionId: location.searchParams.get("sessionId") ?? "",
    sessionToken: location.searchParams.get("sessionToken") ?? "",
    artifactBaseUrl: location.searchParams.get("artifactBaseUrl") ?? "",
    apiBaseUrl: location.searchParams.get("apiBaseUrl") ?? "",
    runtimeVersion: location.searchParams.get("runtimeVersion") ?? "1.0.0"
  };
}
