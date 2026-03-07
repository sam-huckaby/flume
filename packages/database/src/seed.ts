import { InMemoryDatabase } from "./repositories.js";
import { hashPassword } from "@ai-platform/auth";

async function run(): Promise<void> {
  const db = new InMemoryDatabase();
  db.createUser({
    email: "moderator@local.test",
    username: "mod",
    passwordHash: hashPassword("password123"),
    role: "moderator"
  });
  db.createUser({
    email: "developer@local.test",
    username: "dev",
    passwordHash: hashPassword("password123"),
    role: "developer"
  });
  console.log("Seeded in-memory demo users:");
  console.log("- moderator@local.test / password123");
  console.log("- developer@local.test / password123");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
