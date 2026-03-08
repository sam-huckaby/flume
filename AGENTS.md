# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Flume is an AI Game Platform MVP — a pnpm + Turborepo monorepo. See `README.md` for layout, commands, and default ports.

### Services

| Service | Port | Command |
|---------|------|---------|
| Web (Next.js) | 3000 | `pnpm --filter @ai-platform/web dev` |
| API (Fastify) | 4000 | `pnpm --filter @ai-platform/api dev` |
| Runtime Host (Vite) | 3001 | `pnpm --filter @ai-platform/runtime-host dev` |
| Worker | N/A | `pnpm --filter @ai-platform/worker dev` |
| PostgreSQL | 5432 | `docker compose -f infra/docker/docker-compose.yml up -d` |

Start all apps at once: `pnpm dev`

### Non-obvious caveats

- **InMemoryDatabase in dev**: The API and worker use `InMemoryDatabase` at runtime (not Postgres). Postgres is only needed for `pnpm db:migrate` / `pnpm db:seed` scripts. All apps and tests run without a live Postgres connection.
- **Build before seed**: `pnpm db:seed` requires packages to be built first (`pnpm build`) because the seed script imports from `@ai-platform/auth` dist output.
- **No lint scripts**: Individual packages have no `lint` script. `pnpm lint` (via `turbo lint`) completes with zero tasks. TypeScript type checking happens through `tsc` during `pnpm build`.
- **esbuild/sharp build scripts**: The root `package.json` has `pnpm.onlyBuiltDependencies` configured for `esbuild` and `sharp` so their postinstall binaries are downloaded during `pnpm install`.
- **Worker tests**: 3 worker tests (`apps/worker/tests/worker.test.ts`) fail pre-existingly. All other tests (28+) pass.
- **E2E tests**: `pnpm test:e2e` uses Playwright and spins up its own in-process API server with `InMemoryDatabase` — no running dev servers or Postgres needed. Requires `npx playwright install --with-deps chromium` first.
- **Docker for nested containers**: The Cloud VM requires `fuse-overlayfs` storage driver and `iptables-legacy` for Docker to work. The dockerd must be started manually: `sudo dockerd &>/tmp/dockerd.log &`
