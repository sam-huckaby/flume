"use client";

import { useState } from "react";
import { createApiClient } from "../../../lib/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function CreateGamePage() {
  const [sessionId, setSessionId] = useState("");
  const [slug, setSlug] = useState("new-game");
  const [title, setTitle] = useState("New Game");
  const [shortDescription, setShortDescription] = useState("A fast, browser-native arcade release built with the Flume SDK.");
  const [description, setDescription] = useState(
    "Pilot a responsive arcade game through floating arenas while the runtime host keeps every launch isolated and observable."
  );
  const [genre, setGenre] = useState("arcade");
  const [visibility, setVisibility] = useState("draft");
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createApiClient({ baseUrl: apiBaseUrl, sessionId });
    try {
      const response = await client.createGame({
        slug,
        title,
        shortDescription,
        description,
        genre,
        visibility
      });
      setResult(`Created game ${response.game.id}`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Failed");
    }
  }

  const resultTone = result?.startsWith("Created game") ? "status-panel status-panel--success" : "status-panel status-panel--error";

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Create game</p>
          <h1 className="page-title">Open a new title in the developer portal.</h1>
          <p className="section-copy">
            Capture the basics once, then build versions and route them through moderation with a cleaner setup flow.
          </p>
          <div className="badge-row">
            <span className="chip chip--success">Portal form refreshed</span>
            <span className="chip">API-backed submission</span>
          </div>
        </div>
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">What this creates</p>
            <h2 className="section-title">Initial project metadata</h2>
          </div>
          <ul className="check-list">
            <li>Human-readable slug and public-facing title.</li>
            <li>Short description for catalog cards and launch previews.</li>
            <li>Visibility and genre settings ready for future moderation flow.</li>
          </ul>
        </article>
      </div>

      <div className="two-column-grid">
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Submission form</p>
            <h2 className="section-title">Register a new game.</h2>
          </div>
          <form className="form-shell" onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="field-grid">
                <label htmlFor="sessionId">Session ID</label>
                <span className="field-caption">Developer-authenticated session used for API writes.</span>
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
                  <label htmlFor="slug">Slug</label>
                  <input className="input" id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
                </div>
                <div className="field-grid">
                  <label htmlFor="title">Title</label>
                  <input className="input" id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
                </div>
              </div>

              <div className="field-grid">
                <label htmlFor="shortDescription">Short description</label>
                <textarea
                  className="textarea"
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                />
              </div>

              <div className="field-grid">
                <label htmlFor="description">Full description</label>
                <textarea
                  className="textarea"
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="two-column-grid">
                <div className="field-grid">
                  <label htmlFor="genre">Genre</label>
                  <input className="input" id="genre" value={genre} onChange={(event) => setGenre(event.target.value)} />
                </div>
                <div className="field-grid">
                  <label htmlFor="visibility">Visibility</label>
                  <select
                    className="select"
                    id="visibility"
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button className="button-primary" type="submit">
                Create game entry
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
            <p className="eyebrow">Preview</p>
            <h2 className="section-title">How this title will read in the portal.</h2>
          </div>
          <article className="card-panel">
            <div className="badge-row">
              <span className="chip chip--warm">{visibility}</span>
              <span className="chip">{genre}</span>
            </div>
            <h3 className="card-title">{title}</h3>
            <p className="card-copy">{shortDescription}</p>
            <p className="muted-copy">{description}</p>
          </article>
          <ul className="detail-list">
            <li>
              Slug preview: <span className="inline-code">{slug}</span>
            </li>
            <li>Keep the short description crisp so it scans well in the catalog.</li>
            <li>Use the full description to help reviewers understand the build intent.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
