import Link from "next/link";

export default async function DeveloperGameDetailsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return (
    <section>
      <h1>Developer Game Details</h1>
      <p>Game ID: {gameId}</p>
      <ul>
        <li>
          <Link href={`/developer/${gameId}/versions/new`}>Create version</Link>
        </li>
      </ul>
    </section>
  );
}
