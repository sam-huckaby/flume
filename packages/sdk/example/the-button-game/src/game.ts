import { defineGame, type GameInitContext } from "@ai-platform/sdk";

const WIN_TARGET = 10;

type MountStyles = {
  background: string;
  color: string;
  display: string;
  alignItems: string;
  justifyContent: string;
};

type GameState = {
  clicks: number;
  hasWon: boolean;
  canvas: HTMLCanvasElement | null;
  mountNode: HTMLElement | null;
  root: HTMLElement | null;
  counterNode: HTMLParagraphElement | null;
  winMessageNode: HTMLParagraphElement | null;
  actionButton: HTMLButtonElement | null;
  restartButton: HTMLButtonElement | null;
  previousMountStyles: MountStyles | null;
};

const state: GameState = {
  clicks: 0,
  hasWon: false,
  canvas: null,
  mountNode: null,
  root: null,
  counterNode: null,
  winMessageNode: null,
  actionButton: null,
  restartButton: null,
  previousMountStyles: null
};

function ensureCanvas(canvasLike: unknown): HTMLCanvasElement {
  if (!(canvasLike instanceof HTMLCanvasElement)) {
    throw new Error("The Button example expects an HTMLCanvasElement render surface.");
  }
  return canvasLike;
}

function assignStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(element.style, styles);
}

function createGameLayout(): {
  root: HTMLDivElement;
  actionButton: HTMLButtonElement;
  counter: HTMLParagraphElement;
  winMessage: HTMLParagraphElement;
  restartButton: HTMLButtonElement;
} {
  const root = document.createElement("div");
  assignStyles(root, {
    width: "100%",
    height: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    color: "#000000",
    fontFamily: "Arial, sans-serif"
  });

  const title = document.createElement("h1");
  title.textContent = "THE BUTTON";
  assignStyles(title, {
    margin: "0",
    textAlign: "center",
    fontSize: "64px",
    fontWeight: "900",
    lineHeight: "1",
    letterSpacing: "2px"
  });

  const gameArea = document.createElement("div");
  assignStyles(gameArea, {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  });

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.textContent = "Click me";
  assignStyles(actionButton, {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "20px 44px",
    fontSize: "44px",
    fontWeight: "700",
    cursor: "pointer"
  });

  const counter = document.createElement("p");
  assignStyles(counter, {
    margin: "20px 0 0 0",
    fontSize: "36px",
    fontWeight: "700",
    color: "#000000"
  });

  const winMessage = document.createElement("p");
  winMessage.textContent = "You win!";
  assignStyles(winMessage, {
    margin: "20px 0 0 0",
    fontSize: "48px",
    fontWeight: "800",
    display: "none"
  });

  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.textContent = "Restart";
  assignStyles(restartButton, {
    marginTop: "16px",
    backgroundColor: "#111111",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "14px 32px",
    fontSize: "30px",
    fontWeight: "700",
    cursor: "pointer",
    display: "none"
  });

  gameArea.append(actionButton, counter, winMessage, restartButton);
  root.append(title, gameArea);

  return { root, actionButton, counter, winMessage, restartButton };
}

function render(): void {
  if (!state.counterNode || !state.winMessageNode || !state.actionButton || !state.restartButton) {
    return;
  }

  state.counterNode.textContent = `Clicks: ${state.clicks} / ${WIN_TARGET}`;

  if (state.hasWon) {
    state.actionButton.style.display = "none";
    state.counterNode.style.display = "none";
    state.winMessageNode.style.display = "block";
    state.restartButton.style.display = "inline-block";
    return;
  }

  state.actionButton.style.display = "inline-block";
  state.counterNode.style.display = "block";
  state.winMessageNode.style.display = "none";
  state.restartButton.style.display = "none";
}

function resetGame(): void {
  state.clicks = 0;
  state.hasWon = false;
  render();
}

function handleActionClick(): void {
  if (state.hasWon) {
    return;
  }
  state.clicks += 1;
  if (state.clicks >= WIN_TARGET) {
    state.clicks = WIN_TARGET;
    state.hasWon = true;
  }
  render();
}

function initializeLayout(ctx: GameInitContext): void {
  const canvas = ensureCanvas(ctx.render.canvas);
  const mountNode = canvas.parentElement;
  if (!mountNode) {
    throw new Error("Expected runtime canvas to have a mount parent element.");
  }

  state.canvas = canvas;
  state.mountNode = mountNode;
  state.previousMountStyles = {
    background: mountNode.style.background,
    color: mountNode.style.color,
    display: mountNode.style.display,
    alignItems: mountNode.style.alignItems,
    justifyContent: mountNode.style.justifyContent
  };

  assignStyles(mountNode, {
    background: "#ffffff",
    color: "#000000",
    display: "block",
    alignItems: "",
    justifyContent: ""
  });

  canvas.style.display = "none";

  const layout = createGameLayout();
  state.root = layout.root;
  state.actionButton = layout.actionButton;
  state.counterNode = layout.counter;
  state.winMessageNode = layout.winMessage;
  state.restartButton = layout.restartButton;

  layout.actionButton.addEventListener("click", handleActionClick);
  layout.restartButton.addEventListener("click", resetGame);

  mountNode.appendChild(layout.root);
}

function cleanupLayout(): void {
  state.actionButton?.removeEventListener("click", handleActionClick);
  state.restartButton?.removeEventListener("click", resetGame);
  state.root?.remove();

  if (state.canvas) {
    state.canvas.style.display = "";
  }
  if (state.mountNode && state.previousMountStyles) {
    assignStyles(state.mountNode, state.previousMountStyles);
  }

  state.clicks = 0;
  state.hasWon = false;
  state.canvas = null;
  state.mountNode = null;
  state.root = null;
  state.counterNode = null;
  state.winMessageNode = null;
  state.actionButton = null;
  state.restartButton = null;
  state.previousMountStyles = null;
}

export default defineGame({
  manifest: {
    id: "example-the-button",
    title: "The Button",
    version: "1.0.0",
    entry: "dist/main.js",
    sdkVersion: "1.0.0",
    minRuntimeVersion: "1.0.0",
    permissions: ["telemetry"],
    saveSchemaVersion: "1",
    input: { keyboard: false, pointer: true, gamepad: false },
    renderMode: "canvas",
    aiDisclosure: { isAIGenerated: true, notes: "Reference SDK example game." },
    contentRating: { violence: "none", language: "none" }
  },
  init(ctx) {
    initializeLayout(ctx);
    ctx.telemetry.track("example_the_button_init");
  },
  start() {
    resetGame();
  },
  dispose() {
    cleanupLayout();
  }
});
