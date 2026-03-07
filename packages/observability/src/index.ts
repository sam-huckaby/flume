import { telemetryEventSchema, type TelemetryEvent } from "@ai-platform/runtime-contract";

export const telemetryEventNames = [
  "session_started",
  "session_ended",
  "game_loaded",
  "game_load_failed",
  "game_runtime_error",
  "save_requested",
  "save_failed",
  "score_submitted",
  "score_failed"
] as const;

export type StructuredLogger = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};

export function createLogger(namespace: string): StructuredLogger {
  return {
    info(message, meta) {
      console.info(JSON.stringify({ level: "info", namespace, message, meta, ts: new Date().toISOString() }));
    },
    warn(message, meta) {
      console.warn(JSON.stringify({ level: "warn", namespace, message, meta, ts: new Date().toISOString() }));
    },
    error(message, meta) {
      console.error(JSON.stringify({ level: "error", namespace, message, meta, ts: new Date().toISOString() }));
    }
  };
}

export function validateTelemetryEvent(event: unknown): TelemetryEvent {
  return telemetryEventSchema.parse(event);
}
