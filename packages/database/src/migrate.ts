import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const migrationPath = resolve(process.cwd(), "migrations", "0001_init.sql");

async function run(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/ai_game_platform";
  const sql = await readFile(migrationPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Database migration completed.");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
