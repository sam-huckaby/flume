import { z } from "zod";

export const appConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  WEB_PORT: z.coerce.number().default(3000),
  RUNTIME_HOST_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/ai_game_platform")
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return appConfigSchema.parse(env);
}
