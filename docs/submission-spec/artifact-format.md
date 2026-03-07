# Submission Artifact Format

## Canonical layout

```text
artifact-root/
  manifest.json
  dist/
    main.js
  assets/
    ...
```

## Required rules

- Exactly one `manifest.json` at artifact root.
- Manifest must pass `gameManifestSchema` validation.
- `manifest.entry` must point to a JS module under `dist/` (for example `dist/main.js`).
- Uploaded game is loaded through JS module import, **not** arbitrary HTML execution.
- Assets must stay inside allowed directories and extension allowlist.

## Validation checks (MVP)

- `manifest.json` exists.
- manifest is valid (ID/title/version/permissions/entry/etc).
- entry module exists and is a file.
- no symlinks.
- no path traversal.
- file type allowlist only.
- no `.html` execution root.
- file count cap.
- total archive size cap.
- individual asset size cap.

## Smoke test behavior

Worker smoke test attempts:

1. load game module
2. validate export shape
3. create runtime session
4. call `init`
5. call `start`
6. call `dispose`

Worker stores validation and smoke reports on submission/version records.

## Example valid manifest

```json
{
  "id": "minimal-valid-game",
  "title": "Minimal Valid Game",
  "version": "1.0.0",
  "entry": "dist/main.js",
  "sdkVersion": "1.0.0",
  "minRuntimeVersion": "1.0.0",
  "permissions": ["telemetry"],
  "saveSchemaVersion": "1",
  "input": { "keyboard": true, "pointer": false, "gamepad": false },
  "renderMode": "canvas",
  "aiDisclosure": { "isAIGenerated": true },
  "contentRating": { "violence": "none", "language": "none" }
}
```

## Test fixtures

`packages/test-fixtures/fixtures` includes:

- `minimal-valid-game`
- `canvas-valid-game`
- `invalid-manifest-game`
- `undeclared-permission-game`
- `runaway-loop-game`
- `message-spam-game`
- `oversized-asset-game.json`
