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
    return <p>Game not found.</p>;
  }
  return (
    <section>
      <h1>{game.title}</h1>
      <p>{game.description}</p>
      <Link href={`/play/${game.slug}`}>Launch game</Link>
    </section>
  );
}
