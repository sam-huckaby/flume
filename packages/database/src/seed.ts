import { InMemoryDatabase } from "./repositories.js";
import { seedInMemoryDatabase } from "./seed-data.js";

async function run(): Promise<void> {
  const db = new InMemoryDatabase();
  const seeded = await seedInMemoryDatabase(db);
  console.log("Seeded in-memory demo data:");
  console.log(`- moderator: ${seeded.users.moderator.email} / password123`);
  console.log(`- developer: ${seeded.users.developer.email} / password123`);
  console.log(`- player: ${seeded.users.player.email} / password123`);
  console.log(`- game: ${seeded.game.title} (slug: ${seeded.game.slug})`);
  console.log(`- version: ${seeded.version.version} (${seeded.version.id})`);
  console.log(`- artifact root: ${seeded.exampleArtifactPath}`);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
