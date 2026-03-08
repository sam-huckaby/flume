# The Button (SDK Example Game)

This directory contains a Flume submission-ready example game plus SDK-authored source code.

## Structure

```text
the-button-game/
  artifact-root/
    manifest.json
    dist/
      main.js
  src/
    game.ts
```

- `artifact-root/` is ready to submit to Flume as-is.
- `src/game.ts` shows the same game written with `defineGame` from `@ai-platform/sdk` so developers can use it as a template.

## Game behavior

The example implements:

- white page background
- large black title: `THE BUTTON` at the top
- green button centered on the page
- black click counter below the button
- win condition at 10 clicks
- win UI: `You win!` and a restart button

When the player wins, the green button is hidden and restart is shown.
