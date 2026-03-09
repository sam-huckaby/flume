import Link from "next/link";

async function fetchGames() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const response = await fetch(`${base}/games`, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const json = (await response.json()) as { games: Array<{ slug: string; title: string; shortDescription: string }> };
  return json.games;
}

export default async function GamesPage() {
  const games = await fetchGames();

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Game library</p>
          <h1 className="page-title">Browse curated releases ready for browser play.</h1>
          <p className="section-copy">
            Published games appear here once they complete review and move through the release pipeline.
          </p>
        </div>
        <article className="surface-panel">
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">{games.length}</p>
              <p className="metric-label">Published games returned</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Web</p>
              <p className="metric-label">Primary launch surface</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Live</p>
              <p className="metric-label">Catalog freshness</p>
            </article>
          </div>
        </article>
      </div>

      {games.length === 0 ? (
        <article className="empty-panel">
          <h2 className="section-title">No published games yet.</h2>
          <p className="section-copy">Once a version is approved and published, it will appear here for players.</p>
        </article>
      ) : (
        <div className="card-grid">
          {games.map((game) => (
            <article className="card-panel" key={game.slug}>
              <div className="badge-row">
                <span className="chip chip--success">Published</span>
                <span className="chip">{game.slug}</span>
              </div>
              <h2 className="card-title">{game.title}</h2>
              <p className="card-copy">{game.shortDescription}</p>
              <Link className="card-link" href={`/games/${game.slug}`}>
                Open game details
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
