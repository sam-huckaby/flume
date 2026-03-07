import { defineGame } from "../src/index.js";

// @ts-expect-error missing required start lifecycle hook
defineGame({
  manifest: {
    id: "invalid",
    title: "Invalid",
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
  init() {}
});
