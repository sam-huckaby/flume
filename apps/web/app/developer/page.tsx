import Link from "next/link";

export default function DeveloperDashboardPage() {
  return (
    <section>
      <h1>Developer Dashboard</h1>
      <p>Manage your games, versions, and submissions.</p>
      <ul>
        <li>
          <Link href="/developer/create-game">Create game</Link>
        </li>
        <li>
          <Link href="/developer/example-game">Example game details</Link>
        </li>
      </ul>
    </section>
  );
}
