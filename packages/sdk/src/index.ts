import type { GameDefinition } from "@ai-platform/runtime-contract";

export function defineGame(definition: GameDefinition): GameDefinition {
  return definition;
}

export type { GameDefinition, GameInitContext, GameLifecycle, GameManifest } from "@ai-platform/runtime-contract";
