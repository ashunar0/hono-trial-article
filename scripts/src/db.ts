/** The database. Tables live in the domains; src/schema.ts gathers them for drizzle-kit */
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

export type Db = LibSQLDatabase;

/** A db that can only read. Taken by the queries and the …Within tables */
export type ReadDb = Pick<Db, "select">;

export const createDb = (url: string): Db => drizzle(createClient({ url }), { casing: "snake_case" });
