import { resolve } from "node:path";

const base = resolve(process.cwd(), "fixtures");

export const fixturePaths = {
  minimalValidGame: resolve(base, "minimal-valid-game", "artifact-root"),
  canvasValidGame: resolve(base, "canvas-valid-game", "artifact-root"),
  invalidManifestGame: resolve(base, "invalid-manifest-game", "artifact-root"),
  undeclaredPermissionGame: resolve(base, "undeclared-permission-game", "artifact-root"),
  runawayLoopGame: resolve(base, "runaway-loop-game", "artifact-root"),
  messageSpamGame: resolve(base, "message-spam-game", "artifact-root"),
  oversizedAssetGame: resolve(base, "oversized-asset-game.json")
};
