import { describe, expect, it } from "vitest";
import { createLogger, validateTelemetryEvent } from "../src/index.js";

describe("observability package", () => {
  it("builds a logger with all levels", () => {
    const logger = createLogger("test");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("validates telemetry payloads", () => {
    const event = validateTelemetryEvent({
      name: "session_started",
      sessionId: "s1",
      gameId: "g1",
      timestamp: new Date().toISOString(),
      payload: { runtimeVersion: "1.0.0" }
    });
    expect(event.name).toBe("session_started");
  });
});
