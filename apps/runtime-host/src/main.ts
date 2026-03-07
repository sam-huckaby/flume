import { bootstrapRuntime, readBootstrapFromUrl } from "./runtime.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing runtime root element");
}

const bootstrap = readBootstrapFromUrl();
if (!bootstrap.sessionId || !bootstrap.sessionToken || !bootstrap.artifactBaseUrl || !bootstrap.apiBaseUrl) {
  root.innerHTML = "<p>Missing runtime bootstrap parameters.</p>";
} else {
  bootstrapRuntime(bootstrap, root).catch((error) => {
    root.innerHTML = `<p>Runtime failed to boot: ${
      error instanceof Error ? error.message : "Unknown error"
    }</p>`;
  });
}
