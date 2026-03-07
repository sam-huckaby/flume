"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createApiClient } from "../../../../../lib/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function NewVersionPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function createVersion() {
    if (!gameId) {
      setResult("Missing game id");
      return;
    }
    try {
      const client = createApiClient({ baseUrl: apiBaseUrl, sessionId });
      const version = await client.createVersion(gameId, {
        version: "1.0.0",
        manifestJson: { id: gameId },
        sdkVersion: "1.0.0",
        runtimeVersionRange: ">=1.0.0"
      });
      setResult(`Version created: ${version.version.id}`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Error");
    }
  }

  return (
    <section>
      <h1>Create Version</h1>
      <p>Game ID: {gameId}</p>
      <label>
        Session ID
        <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
      </label>
      <button onClick={createVersion} type="button">
        Create v1.0.0
      </button>
      {result ? <p>{result}</p> : null}
    </section>
  );
}
