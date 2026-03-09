import Link from "next/link";

export default function DeveloperDashboardPage() {
  const pipelineCards = [
    {
      title: "Create game records",
      body: "Register a new title, define its slug, and set the initial visibility before it reaches review."
    },
    {
      title: "Package release versions",
      body: "Track SDK, runtime compatibility, and manifest metadata for every version you prepare."
    },
    {
      title: "Coordinate publish flow",
      body: "Hand releases to moderators with enough context to approve and publish with confidence."
    }
  ];

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Developer portal</p>
          <h1 className="page-title">Ship new games and releases from one polished workspace.</h1>
          <p className="section-copy">
            Manage your catalog, prepare versions, and keep moderation hand-off obvious. This portal keeps the release
            path readable even while the product is still in MVP.
          </p>
          <div className="action-row">
            <Link className="button-primary" href="/developer/create-game">
              Create a game
            </Link>
            <Link className="button-secondary" href="/developer/example-game">
              Open example project
            </Link>
          </div>
        </div>
        <div className="surface-panel">
          <div className="badge-row">
            <span className="badge">Portal refreshed</span>
            <span className="badge">Ready for release ops</span>
          </div>
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">01</p>
              <p className="metric-label">Game creation flow</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">02</p>
              <p className="metric-label">Version preparation flow</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">03</p>
              <p className="metric-label">Moderation hand-off</p>
            </article>
          </div>
        </div>
      </div>

      <section className="page-stack">
        <div className="section-header">
          <p className="eyebrow">Release pipeline</p>
          <h2 className="section-title">A clearer path from concept to curated launch.</h2>
        </div>
        <div className="card-grid">
          {pipelineCards.map((item) => (
            <article className="card-panel" key={item.title}>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-copy">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column-grid">
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Quick actions</p>
            <h2 className="section-title">Start with the next release task.</h2>
          </div>
          <div className="list-stack">
            <Link className="card-panel card-link" href="/developer/create-game">
              Create game entry
            </Link>
            <Link className="card-panel card-link" href="/developer/example-game">
              Review example project
            </Link>
            <Link className="card-panel card-link" href="/moderator">
              Check moderator queue
            </Link>
          </div>
        </article>

        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Workspace notes</p>
            <h2 className="section-title">What this portal now emphasizes.</h2>
          </div>
          <ul className="check-list">
            <li>More structured hierarchy for hero, actions, and operational detail.</li>
            <li>Consistent cards and form styling across developer flows.</li>
            <li>Cleaner navigation between game setup, versioning, and moderation.</li>
          </ul>
        </article>
      </section>
    </section>
  );
}
