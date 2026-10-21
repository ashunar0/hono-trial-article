/** An app on a fresh in-memory database, and a short way to call it */
import { migrate } from "drizzle-orm/libsql/migrator";
import { vi } from "vitest";
import { createApp } from "../src/app";
import { createDb } from "../src/db";
import { makeDeps } from "../src/deps";

export async function setup() {
  const db = createDb(":memory:");
  await migrate(db, { migrationsFolder: "drizzle" });
  const app = createApp(makeDeps(db));
  // The entry points read the clock. Each request comes a second after the last, so order by time is decided
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-21T00:00:00Z") });

  const call = async (method: string, path: string, body?: unknown): Promise<{ status: number; body: any }> => {
    vi.setSystemTime(Date.now() + 1000);
    const res = await app.request(path, {
      method,
      ...(body !== undefined && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    });

    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  };

  return { call };
}
