import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
});
