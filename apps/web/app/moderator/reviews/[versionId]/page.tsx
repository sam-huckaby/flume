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

  return (
    <section>
      <h1>Review Version</h1>
      <p>Version ID: {versionId}</p>
      <label>
        Moderator Session ID
        <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
      </label>
      <button onClick={approveAndPublish} type="button">
        Approve and publish
      </button>
      {result ? <p>{result}</p> : null}
    </section>
  );
}
