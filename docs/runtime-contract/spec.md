# Runtime Contract Specification

## Package

`packages/runtime-contract`

## Manifest schema

`GameManifest` fields:

- `id`
- `title`
- `version`
- `entry` (strictly `dist/*.js` style path, no traversal)
- `sdkVersion`
- `minRuntimeVersion`
- `permissions`: `storage | leaderboards | telemetry`
- `saveSchemaVersion`
- `input`: keyboard/pointer/gamepad booleans
- `renderMode`: `canvas`
- `aiDisclosure`
- `contentRating`

Validator export: `gameManifestSchema`.

## Permission model

Supported permissions:

- `storage`
- `leaderboards`
- `telemetry`

No raw network permission is exposed in SDK or manifest model for MVP.

## Lifecycle contract

`GameDefinition`:

- `manifest`
- `init(ctx)`
- `start(options?)`
- optional `pause`, `resume`, `resize`, `dispose`

`GameInitContext` exposes:

- runtime metadata
- controlled render canvas and dimensions
- input subscriptions
- permission-gated `storage` and `leaderboards`
- telemetry and logger

## Runtime lifecycle state machine

States:

- `created`
- `initialized`
- `running`
- `paused`
- `disposed`
- `errored`

Allowed transitions:

- `created -> initialized`
- `initialized -> running`
- `running -> paused`
- `paused -> running`
- `running -> disposed`
- `paused -> disposed`
- active state -> `errored` -> `disposed`

Invalid transitions are rejected by `runtime-client`.

## Bridge message schemas

`bridgeMessageSchema` includes:

- parent -> runtime (`runtime.bootstrap`, `runtime.pause`, `runtime.resume`, `runtime.dispose`)
- runtime -> parent (`runtime.ready`, `runtime.error`, `runtime.telemetry`)
- game -> runtime API requests (`game.storage.save`, `game.storage.load`, `game.leaderboards.submitScore`, `game.telemetry.track`)
- runtime -> game API responses (`runtime.response.ok`, `runtime.response.error`)

## Telemetry schema

`telemetryEventSchema` typed events:

- `session_started`
- `session_ended`
- `game_loaded`
- `game_load_failed`
- `game_runtime_error`
- `save_requested`
- `save_failed`
- `score_submitted`
- `score_failed`

## Compatibility helpers

- `isManifestCompatibleWithRuntime(manifest, runtimeVersion)`
- `isSdkCompatibleWithRuntime(sdkVersion, runtimeVersion)`

MVP compatibility logic:

- manifest uses semver `>= minRuntimeVersion`
- sdk/runtime compatibility requires matching major versions
