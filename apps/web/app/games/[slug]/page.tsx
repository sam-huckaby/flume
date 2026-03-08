import Link from "next/link";

async function fetchGame(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const response = await fetch(`${base}/games/${slug}`, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const json = (await response.json()) as {
    game: { slug: string; title: string; description: string };
  };
  return json.game;
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await fetchGame(slug);
  if (!game) {
    return (
      <section className="page-stack">
        <article className="empty-panel">
          <h1 className="page-title">Game not found.</h1>
          <p className="section-copy">This slug is not currently available in the published catalog.</p>
          <Link className="button-secondary" href="/games">
            Return to games
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Published game</p>
          <h1 className="page-title">{game.title}</h1>
          <p className="section-copy">{game.description}</p>
          <div className="action-row">
            <Link className="button-primary" href={`/play/${game.slug}`}>
              Launch game
            </Link>
            <Link className="button-secondary" href="/games">
              Back to library
            </Link>
          </div>
        </div>
        <article className="surface-panel">
          <div className="badge-row">
            <span className="chip chip--success">Launchable</span>
            <span className="chip">{game.slug}</span>
          </div>
          <ul className="detail-list">
            <li>Loads through the runtime host with a fresh play session.</li>
            <li>Published versions are selected automatically before launch.</li>
            <li>Players stay inside the browser without additional install steps.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
