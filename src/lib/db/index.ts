import "server-only";
import { cache } from "react";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

const isWorkers = () =>
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function connectionString(): string {
  // Cloudflare: Hyperdrive gives a pooled, edge-local connection string.
  if (isWorkers()) {
    try {
      const hd = (getCloudflareContext().env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
      if (hd?.connectionString) return hd.connectionString;
    } catch {
      /* fall through */
    }
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  return url;
}

function create(): Db {
  const client = postgres(connectionString(), {
    max: isWorkers() ? 5 : 10,
    fetch_types: false, // required for Hyperdrive/Workers
    prepare: false, // pgbouncer/Hyperdrive-safe
    idle_timeout: 20,
  });
  return drizzle(client, { schema });
}

const g = globalThis as unknown as { __marvelDb?: Db };

// Workers forbid sharing I/O objects across requests → one client per request (React cache scope).
// Node (dev / `next start`) → one process-wide pool.
const perRequest = cache(create);

export function getDb(): Db {
  if (isWorkers()) return perRequest();
  return (g.__marvelDb ??= create());
}

export { schema };
