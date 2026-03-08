"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createApiClient } from "../../../../../lib/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function NewVersionPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const [sessionId, setSessionId] = useState("");
  const [versionNumber, setVersionNumber] = useState("1.0.0");
  const [sdkVersion, setSdkVersion] = useState("1.0.0");
  const [runtimeVersionRange, setRuntimeVersionRange] = useState(">=1.0.0");
  const [result, setResult] = useState<string | null>(null);

  async function createVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameId) {
      setResult("Missing game id");
      return;
    }
    try {
      const client = createApiClient({ baseUrl: apiBaseUrl, sessionId });
      const version = await client.createVersion(gameId, {
        version: versionNumber,
        manifestJson: {
          id: gameId,
          releaseChannel: "stable",
          runtimeVersionRange
        },
        sdkVersion,
        runtimeVersionRange
      });
      setResult(`Version created: ${version.version.id}`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Error");
    }
  }

  const resultTone = result?.startsWith("Version created:") ? "status-panel status-panel--success" : "status-panel status-panel--error";

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">New version</p>
          <h1 className="page-title">Prepare a release build for {gameId}.</h1>
          <p className="section-copy">
            Capture the version identifier, runtime compatibility, and manifest context that reviewers need before the build
            moves further down the pipeline.
          </p>
          <div className="badge-row">
            <span className="chip chip--success">Game ID: {gameId}</span>
            <span className="chip">Release prep</span>
          </div>
        </div>
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Release notes</p>
            <h2 className="section-title">Keep the metadata explicit.</h2>
          </div>
          <ul className="check-list">
            <li>Version strings should map directly to uploaded build artifacts.</li>
            <li>Runtime range tells operators which host versions are safe to use.</li>
            <li>SDK version helps reviewers validate toolchain compatibility.</li>
          </ul>
        </article>
      </div>

      <div className="two-column-grid">
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Version form</p>
            <h2 className="section-title">Create the next version record.</h2>
          </div>
          <form className="form-shell" onSubmit={createVersion}>
            <div className="form-grid">
              <div className="field-grid">
                <label htmlFor="sessionId">Session ID</label>
                <input
                  className="input"
                  id="sessionId"
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  placeholder="session-dev-123"
                />
              </div>
              <div className="two-column-grid">
                <div className="field-grid">
                  <label htmlFor="versionNumber">Version</label>
                  <input
                    className="input"
                    id="versionNumber"
                    value={versionNumber}
                    onChange={(event) => setVersionNumber(event.target.value)}
                  />
                </div>
                <div className="field-grid">
                  <label htmlFor="sdkVersion">SDK version</label>
                  <input
                    className="input"
                    id="sdkVersion"
                    value={sdkVersion}
                    onChange={(event) => setSdkVersion(event.target.value)}
                  />
                </div>
              </div>
              <div className="field-grid">
                <label htmlFor="runtimeRange">Runtime version range</label>
                <input
                  className="input"
                  id="runtimeRange"
                  value={runtimeVersionRange}
                  onChange={(event) => setRuntimeVersionRange(event.target.value)}
                />
              </div>
            </div>
            <div className="action-row">
              <button className="button-primary" type="submit">
                Create version record
              </button>
            </div>
          </form>
          {result ? (
            <div className={resultTone}>
              <span className="status-dot" />
              <p className="body-copy">{result}</p>
            </div>
          ) : null}
        </article>

        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Version preview</p>
            <h2 className="section-title">Release metadata at a glance.</h2>
          </div>
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">{versionNumber}</p>
              <p className="metric-label">Release version</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">{sdkVersion}</p>
              <p className="metric-label">SDK version</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">{runtimeVersionRange}</p>
              <p className="metric-label">Runtime range</p>
            </article>
          </div>
          <ul className="detail-list">
            <li>Manifest will carry the project ID and runtime range.</li>
            <li>Use a semver release string so publish tooling stays predictable.</li>
            <li>After creation, the next step is artifact upload and moderation review.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
