"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createApiClient } from "../../../../lib/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ModeratorReviewDetailPage() {
  const params = useParams<{ versionId: string }>();
  const versionId = params.versionId;
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function approveAndPublish() {
    if (!versionId) {
      setResult("Missing version id");
      return;
    }
    try {
      const client = createApiClient({ baseUrl: apiBaseUrl, sessionId });
      await client.approveVersion(versionId);
      await client.publishVersion(versionId);
      setResult("Version approved and published.");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Failed");
    }
  }

  const resultTone =
    result === "Version approved and published." ? "status-panel status-panel--success" : "status-panel status-panel--error";

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Review detail</p>
          <h1 className="page-title">Moderate version {versionId}</h1>
          <p className="section-copy">
            Approve the version once policy, metadata, and runtime compatibility all look safe for publication.
          </p>
          <div className="badge-row">
            <span className="chip chip--warm">Pending manual decision</span>
            <span className="chip">{versionId}</span>
          </div>
        </div>
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Review checklist</p>
            <h2 className="section-title">Before you publish.</h2>
          </div>
          <ul className="check-list">
            <li>Verify the version belongs to the expected game and build lineage.</li>
            <li>Confirm runtime compatibility and the declared release scope.</li>
            <li>Approve first, then publish through the same action to keep the flow simple.</li>
          </ul>
        </article>
      </div>

      <div className="two-column-grid">
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Approval action</p>
            <h2 className="section-title">Authorize this release.</h2>
          </div>
          <div className="form-shell">
            <div className="field-grid">
              <label htmlFor="moderatorSessionId">Moderator session ID</label>
              <input
                className="input"
                id="moderatorSessionId"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
                placeholder="session-mod-123"
              />
            </div>
            <div className="action-row">
              <button className="button-primary" onClick={approveAndPublish} type="button">
                Approve and publish
              </button>
            </div>
            {result ? (
              <div className={resultTone}>
                <span className="status-dot" />
                <p className="body-copy">{result}</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Decision context</p>
            <h2 className="section-title">What this action does.</h2>
          </div>
          <ul className="detail-list">
            <li>Calls the approval endpoint for the selected version.</li>
            <li>Immediately follows with publish to reduce moderator friction.</li>
            <li>Returns the server response directly in the status panel.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
