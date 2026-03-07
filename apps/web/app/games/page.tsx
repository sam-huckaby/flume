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
    <section>
      <h1>Games</h1>
      {games.length === 0 ? <p>No published games yet.</p> : null}
      <ul>
        {games.map((game) => (
          <li key={game.slug}>
            <Link href={`/games/${game.slug}`}>{game.title}</Link> - {game.shortDescription}
          </li>
        ))}
      </ul>
    </section>
  );
}
