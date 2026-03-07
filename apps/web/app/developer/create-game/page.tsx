"use client";

import { useState } from "react";
import { createApiClient } from "../../../lib/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function CreateGamePage() {
  const [sessionId, setSessionId] = useState("");
  const [slug, setSlug] = useState("new-game");
  const [title, setTitle] = useState("New Game");
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createApiClient({ baseUrl: apiBaseUrl, sessionId });
    try {
      const response = await client.createGame({
        slug,
        title,
        shortDescription: "Created from dashboard",
        description: "Developer-submitted game",
        genre: "arcade",
        visibility: "draft"
      });
      setResult(`Created game ${response.game.id}`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <section>
      <h1>Create Game</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", maxWidth: 420, gap: 8 }}>
        <label>
          Session ID
          <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(event) => setSlug(event.target.value)} />
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <button type="submit">Create</button>
      </form>
      {result ? <p>{result}</p> : null}
    </section>
  );
}
