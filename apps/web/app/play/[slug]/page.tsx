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
    return <p>Unable to launch this game right now.</p>;
  }
  const runtimeHost = process.env.NEXT_PUBLIC_RUNTIME_HOST_URL ?? "http://localhost:3001";
  const src = `${runtimeHost}?sessionId=${encodeURIComponent(result.playSession.session.id)}&sessionToken=${encodeURIComponent(
    result.playSession.sessionToken
  )}&artifactBaseUrl=${encodeURIComponent(result.playSession.bootstrap.artifactBaseUrl)}&apiBaseUrl=${encodeURIComponent(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
  )}&runtimeVersion=1.0.0`;

  return (
    <section>
      <h1>Playing: {result.game.title}</h1>
      <iframe
        src={src}
        title="Runtime Host"
        width={960}
        height={640}
        style={{ border: "1px solid #2a3553", background: "#000" }}
      />
    </section>
  );
}
