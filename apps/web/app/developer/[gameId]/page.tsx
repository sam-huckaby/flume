import Link from "next/link";

export default async function DeveloperGameDetailsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Project overview</p>
          <h1 className="page-title">Release workspace for {gameId}</h1>
          <p className="section-copy">
            Use this project view to track the next build, line up version metadata, and keep launch readiness visible to
            reviewers.
          </p>
          <div className="badge-row">
            <span className="chip chip--success">Draft project</span>
            <span className="chip">Game ID: {gameId}</span>
          </div>
          <div className="action-row">
            <Link className="button-primary" href={`/developer/${gameId}/versions/new`}>
              Create next version
            </Link>
            <Link className="button-secondary" href={`/games/${gameId}`}>
              View public detail route
            </Link>
          </div>
        </div>
        <div className="surface-panel">
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">v1.0.0</p>
              <p className="metric-label">Suggested next release</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Ready</p>
              <p className="metric-label">Review status target</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Web</p>
              <p className="metric-label">Primary runtime surface</p>
            </article>
          </div>
          <ul className="detail-list">
            <li>Prepare manifest metadata before upload.</li>
            <li>Align SDK and runtime versions so reviewers can approve quickly.</li>
            <li>Keep your publish notes crisp and release-ready.</li>
          </ul>
        </div>
      </div>

      <section className="two-column-grid">
        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Release checklist</p>
            <h2 className="section-title">Before you submit the next build.</h2>
          </div>
          <ul className="check-list">
            <li>Verify the game slug and external title are correct.</li>
            <li>Confirm the version manifest matches the runtime you intend to support.</li>
            <li>Capture a short changelog for moderators and launch staff.</li>
          </ul>
        </article>

        <article className="surface-panel">
          <div className="section-header">
            <p className="eyebrow">Current project details</p>
            <h2 className="section-title">Pinned metadata</h2>
          </div>
          <ul className="detail-list">
            <li>
              Internal identifier: <span className="inline-code">{gameId}</span>
            </li>
            <li>Launches through the runtime host after publish.</li>
            <li>Uses the developer portal as the primary authoring surface.</li>
          </ul>
        </article>
      </section>
    </section>
  );
}
