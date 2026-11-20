import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createApp } from "./app";
import { createDb } from "./db";
import { makeDeps } from "./deps";

const db = createDb(process.env.DATABASE_URL ?? "file:local.db");
await migrate(db, { migrationsFolder: "drizzle" });

serve({ fetch: createApp(makeDeps(db)).fetch, port: 3000 }, (info) =>
  console.log(`http://localhost:${info.port}`),
);
