import { createApiServer } from "./server.js";
import { seedInMemoryDatabase } from "@ai-platform/database";

const port = Number(process.env.API_PORT ?? 4000);
const app = createApiServer();

async function start(): Promise<void> {
  await seedInMemoryDatabase(app.ctx.db);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API listening on ${port}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
