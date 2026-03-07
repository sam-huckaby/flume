# API Endpoints (MVP)

Base URL: `http://localhost:4000`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Games

- `POST /games`
- `GET /games`
- `GET /games/:slug`
- `PATCH /games/:gameId`

## Versions and submissions

- `POST /games/:gameId/versions`
- `GET /games/:gameId/versions`
- `GET /versions/:versionId`
- `POST /versions/:versionId/upload`
- `POST /versions/:versionId/submit-for-review`
- `POST /versions/:versionId/approve`
- `POST /versions/:versionId/reject`
- `POST /versions/:versionId/publish`
- `POST /versions/:versionId/revoke`

## Play sessions

- `POST /play-sessions`
- `POST /play-sessions/:sessionId/heartbeat`
- `POST /play-sessions/:sessionId/end`

## Saves

- `PUT /games/:gameId/saves/:slotKey`
- `GET /games/:gameId/saves/:slotKey`

## Scores

- `POST /games/:gameId/scores`
- `GET /games/:gameId/scores`

## Telemetry

- `POST /telemetry/events`

## Auth/session notes

- User-authenticated endpoints accept `x-session-id`.
- Runtime-scoped calls support `x-session-token` (play-session token hash validation).

## Validation notes

- Request payloads are validated with Zod at API boundaries.
- Publish/review transitions are guarded by explicit state transition rules.
