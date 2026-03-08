import Link from "next/link";

export default function HomePage() {
  return (
    <section
      style={{
        maxWidth: 980,
        margin: "0 auto",
        display: "grid",
        gap: 28,
        padding: "32px 12px 48px"
      }}
    >
      <div
        style={{
          border: "1px solid #2a3553",
          borderRadius: 20,
          background:
            "radial-gradient(circle at top left, rgba(125, 102, 255, 0.22), rgba(11, 16, 32, 0.95) 48%), #0b1020",
          padding: "40px 32px",
          boxShadow: "0 24px 48px rgba(3, 8, 18, 0.4)"
        }}
      >
        <p style={{ margin: 0, color: "#95a1c4", fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          AI game platform
        </p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(56px, 12vw, 120px)", lineHeight: 0.9 }}>Flume</h1>
        <p style={{ margin: 0, maxWidth: 680, color: "#d3ddf7", fontSize: 18, lineHeight: 1.5 }}>
          Build with the SDK, ship safely, and play instantly. Flume gives developers a streamlined pipeline and players
          a reliable runtime for curated browser games.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          <Link
            href="/games"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#6f63ff",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Play games
          </Link>
          <Link
            href="/developer"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #44527a",
              color: "#dce6ff",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Developer dashboard
          </Link>
          <Link
            href="/moderator"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #44527a",
              color: "#dce6ff",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Moderator queue
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          { title: "Submit", body: "Upload SDK-compiled artifacts with explicit runtime permissions." },
          { title: "Review", body: "Moderate and publish approved versions through a clear release path." },
          { title: "Launch", body: "Run games in an isolated host with telemetry and session controls." }
        ].map((item) => (
          <article
            key={item.title}
            style={{
              border: "1px solid #2a3553",
              borderRadius: 14,
              padding: "16px 18px",
              background: "#121936"
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>{item.title}</h2>
            <p style={{ margin: "8px 0 0", color: "#bcc8e8", lineHeight: 1.45 }}>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
