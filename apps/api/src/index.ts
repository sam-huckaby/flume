import { createApiServer } from "./server.js";

const port = Number(process.env.API_PORT ?? 4000);
const app = createApiServer();

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    console.log(`API listening on ${port}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
