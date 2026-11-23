import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Copie .env.example para .env.local e configure o Postgres.",
  );
}

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

/**
 * Pool único por processo. `prepare: false` mantém compatibilidade com
 * poolers em modo transaction (Neon, Supabase, PgBouncer) — é o que evita
 * a aplicação "quebrar" quando o banco é colocado atrás de um proxy.
 */
const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema, logger: process.env.DRIZZLE_LOG === "1" });
export type Database = typeof db;
export { schema };
