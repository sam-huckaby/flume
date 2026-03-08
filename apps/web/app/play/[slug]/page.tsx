async function getPlayableVersion(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const gameResponse = await fetch(`${apiBase}/games/${slug}`, { cache: "no-store" });
  if (!gameResponse.ok) {
    return null;
  }
  const gameJson = (await gameResponse.json()) as { game: { id: string; slug: string; title: string } };
  const versionsResponse = await fetch(`${apiBase}/games/${gameJson.game.id}/versions`, { cache: "no-store" });
  if (!versionsResponse.ok) {
    return null;
  }
  const versionsJson = (await versionsResponse.json()) as {
    versions: Array<{ id: string; publishState: string; version: string }>;
  };
  const published = versionsJson.versions.find((version) => version.publishState === "published");
  if (!published) {
    return null;
  }
  const playSessionResponse = await fetch(`${apiBase}/play-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameVersionId: published.id,
      runtimeVersion: "1.0.0"
    })
  });
  if (!playSessionResponse.ok) {
    return null;
  }
  const playSession = (await playSessionResponse.json()) as {
    session: { id: string };
    sessionToken: string;
    bootstrap: { artifactBaseUrl: string };
  };
  return {
    game: gameJson.game,
    version: published,
    playSession
  };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPlayableVersion(slug);
  if (!result) {
    return (
      <section className="page-stack">
        <article className="empty-panel">
          <h1 className="page-title">Unable to launch this game right now.</h1>
          <p className="section-copy">There is no published version ready for a runtime session yet.</p>
        </article>
      </section>
    );
  }
  const runtimeHost = process.env.NEXT_PUBLIC_RUNTIME_HOST_URL ?? "http://localhost:3001";
  const src = `${runtimeHost}?sessionId=${encodeURIComponent(result.playSession.session.id)}&sessionToken=${encodeURIComponent(
    result.playSession.sessionToken
  )}&artifactBaseUrl=${encodeURIComponent(result.playSession.bootstrap.artifactBaseUrl)}&apiBaseUrl=${encodeURIComponent(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
  )}&runtimeVersion=1.0.0`;

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Runtime launch</p>
          <h1 className="page-title">Playing: {result.game.title}</h1>
          <p className="section-copy">
            Flume creates a fresh play session, hands runtime configuration to the host, and opens the published version
            directly in the browser.
          </p>
          <div className="badge-row">
            <span className="chip chip--success">Session {result.playSession.session.id}</span>
            <span className="chip">Version {result.version.version}</span>
          </div>
        </div>
        <article className="surface-panel">
          <ul className="detail-list">
            <li>Runtime host URL is supplied by environment configuration.</li>
            <li>Artifact base URL and session token are encoded into the launch request.</li>
            <li>Only published versions are eligible for play.</li>
          </ul>
        </article>
      </div>
      <div className="iframe-shell">
        <iframe className="runtime-frame" src={src} title="Runtime Host" />
      </div>
    </section>
  );
}
