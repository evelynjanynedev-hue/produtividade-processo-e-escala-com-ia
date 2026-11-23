import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/execucao";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: false,
});
