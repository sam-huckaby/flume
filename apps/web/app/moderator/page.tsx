import Link from "next/link";

export default function ModeratorReviewsPage() {
  return (
    <section className="page-stack">
      <div className="hero-panel hero-grid">
        <div className="section-header">
          <p className="eyebrow">Moderator queue</p>
          <h1 className="page-title">Review pending submissions with clearer release context.</h1>
          <p className="section-copy">
            This queue remains intentionally lean, but it now matches the rest of the product and highlights the single
            approval action moderators need most.
          </p>
        </div>
        <article className="surface-panel">
          <div className="stats-grid">
            <article className="card-panel">
              <p className="metric-value">1</p>
              <p className="metric-label">Example review route</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Fast</p>
              <p className="metric-label">Decision workflow</p>
            </article>
            <article className="card-panel">
              <p className="metric-value">Manual</p>
              <p className="metric-label">Moderation model</p>
            </article>
          </div>
        </article>
      </div>

      <article className="surface-panel">
        <div className="section-header">
          <p className="eyebrow">Pending review</p>
          <h2 className="section-title">Example submission</h2>
          <p className="section-copy">Open the example route to approve and publish a version from the refreshed queue.</p>
        </div>
        <div className="action-row">
          <Link className="button-primary" href="/moderator/reviews/example-version-id">
            Review example version
          </Link>
        </div>
      </article>
    </section>
  );
}
