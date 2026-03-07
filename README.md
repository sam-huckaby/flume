# Flume — AI Game Platform MVP

**Flume** is an MVP platform for **SDK-compiled AI browser games** with a strict runtime contract, validation pipeline, moderation flow, and isolated runtime host model.

## Core principles

- Games are submitted as platform artifacts (not arbitrary websites).
- Runtime host is deployable on a separate origin (`localhost:3001` in dev).
- SDK surface is permission-based and narrow (storage, leaderboards, telemetry).
- Artifact validation and smoke testing happen in an async worker.

## Monorepo layout

```text
ai-game-platform/
  apps/
    web/            # Next.js user-facing app
    api/            # Fastify API
    runtime-host/   # Vite runtime host (separate origin)
    worker/         # Validation + smoke-test worker

  packages/
    runtime-contract/
    sdk/
    runtime-client/
    database/
    auth/
    observability/
    config/
    test-fixtures/

  docs/
  infra/
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local Postgres)

## Local setup

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
```

## Run apps

```bash
# Run all package/app dev commands through Turbo
pnpm dev

# Or individually:
pnpm --filter @ai-platform/api dev
pnpm --filter @ai-platform/web dev
pnpm --filter @ai-platform/runtime-host dev
pnpm --filter @ai-platform/worker dev
```

Default local ports:

- Web app: `http://localhost:3000`
- Runtime host: `http://localhost:3001`
- API: `http://localhost:4000`

## Tests

```bash
# Unit + integration tests
pnpm test

# End-to-end tests
pnpm test:e2e
```

## Database commands

```bash
pnpm db:migrate
pnpm db:seed
```

## Artifact and runtime model

- Submission format: `artifact-root/manifest.json`, `artifact-root/dist/main.js`, `artifact-root/assets/*`
- Worker validates structure, permissions, entry module, file safety/limits, and smoke test status.
- Runtime host loads approved artifacts via manifest + entry module import and executes lifecycle through `runtime-client`.

## Documentation

- `docs/architecture/overview.md`
- `docs/runtime-contract/spec.md`
- `docs/submission-spec/artifact-format.md`
- `docs/api/endpoints.md`
