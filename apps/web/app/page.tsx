import Link from "next/link";

export default function HomePage() {
  const featureCards = [
    {
      title: "Ship with confidence",
      body: "Version every game release, capture review status, and move through a clear publish path."
    },
    {
      title: "Run in a controlled host",
      body: "Launch curated browser games with consistent runtime hand-off, session wiring, and telemetry hooks."
    },
    {
      title: "Operate from one portal",
      body: "Developers, moderators, and players share a single polished surface instead of disconnected MVP screens."
    }
  ];

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">AI game platform</p>
          <h1 className="hero-title">Secure release flow. Instant browser play.</h1>
          <p className="hero-copy">
            Flume gives developers a polished portal for shipping SDK-built games, moderators a clean approval queue, and
            players a dependable runtime hand-off.
          </p>
          <div className="action-row">
            <Link className="button-primary" href="/developer">
              Open developer portal
            </Link>
            <Link className="button-secondary" href="/games">
              Browse games
            </Link>
            <Link className="button-ghost" href="/moderator">
              View moderation queue
            </Link>
          </div>
        </div>
        <div className="surface-panel">
          <div className="badge-row">
            <span className="chip chip--success">Healthy release path</span>
            <span className="chip chip--warm">Curated publishing</span>
          </div>
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">3</p>
              <p className="metric-label">Core surfaces unified</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">1</p>
              <p className="metric-label">Modern developer portal</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">16.1.6</p>
              <p className="metric-label">Pinned Next.js version</p>
            </article>
          </div>
          <ul className="detail-list">
            <li>Build and create new game records from the portal.</li>
            <li>Prepare version payloads and submit them for review.</li>
            <li>Launch published games into the runtime host with session context.</li>
          </ul>
        </div>
      </div>

      <section className="page-stack">
        <div className="section-header">
          <p className="eyebrow">Why teams use Flume</p>
          <h2 className="page-title">A cleaner platform surface for every role.</h2>
          <p className="section-copy">
            The platform now feels like a cohesive product, with modern cards, stronger hierarchy, and a clearer developer
            workflow from creation to launch.
          </p>
        </div>
        <div className="card-grid">
          {featureCards.map((item) => (
            <article className="card-panel" key={item.title}>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-copy">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
