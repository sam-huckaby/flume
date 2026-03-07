# Architecture Overview

## System components

- **apps/web**: public browsing, developer workflows, moderator workflows, play page embedding runtime host.
- **apps/api**: auth, games/versions/submissions, moderation transitions, play sessions, saves/scores, telemetry ingest.
- **apps/worker**: artifact validation and smoke testing pipeline.
- **apps/runtime-host**: isolated game execution host for SDK artifacts.
- **shared packages**: runtime contract, SDK, runtime client, database schema/repositories, auth helpers, observability.

## Runtime isolation model

- Main platform app and runtime host are separate deployable apps.
- Local development uses separate ports:
  - `localhost:3000` (web)
  - `localhost:3001` (runtime-host)
- Runtime host only receives session-scoped bootstrap data (session ID/token and artifact/API endpoints).
- Runtime does not receive broad web app auth context.

## Submission flow

1. Developer creates game + version.
2. Developer uploads artifact reference (local storage key boundary for MVP).
3. Worker validates:
   - manifest presence and schema
   - entry module existence
   - file type allowlist / no symlinks / no path traversal
   - file/size caps
   - no arbitrary HTML execution root
4. Worker runs smoke test (`init -> start -> dispose`).
5. Version statuses are updated (`validation_status`, `smoke_test_status`).
6. Moderator approves/rejects and can publish/revoke.

## Play flow

1. Player opens game page in web app.
2. Web app requests `POST /play-sessions`.
3. API returns session metadata + scoped session token.
4. Web app embeds runtime host iframe with bootstrap parameters.
5. Runtime host fetches manifest/artifact entry, validates compatibility, starts game session lifecycle.
6. Runtime client composes capabilities based on declared manifest permissions.
7. Saves/scores/telemetry flow through API boundary.

## Security boundaries

- No arbitrary uploaded HTML app shell execution.
- SDK surface excludes raw privileged platform handles.
- Permission-based capability composition (`storage`, `leaderboards`, `telemetry`).
- Session-scoped runtime token support for runtime calls.
- Defensive lifecycle/error handling with explicit state transitions.
