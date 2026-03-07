import Link from "next/link";

export default function HomePage() {
  return (
    <section>
      <h1>AI Game Platform MVP</h1>
      <p>Developers submit SDK-compiled artifacts. Players launch approved games in an isolated runtime host.</p>
      <ul>
        <li>
          <Link href="/games">Browse games</Link>
        </li>
        <li>
          <Link href="/developer">Developer dashboard</Link>
        </li>
        <li>
          <Link href="/moderator">Moderator reviews</Link>
        </li>
      </ul>
    </section>
  );
}
