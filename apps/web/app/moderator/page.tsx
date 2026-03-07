import Link from "next/link";

export default function ModeratorReviewsPage() {
  return (
    <section>
      <h1>Pending Reviews</h1>
      <p>This MVP screen lists submissions pending manual moderation.</p>
      <ul>
        <li>
          <Link href="/moderator/reviews/example-version-id">Review Example Version</Link>
        </li>
      </ul>
    </section>
  );
}
