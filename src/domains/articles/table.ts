import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "../users/table";

export const articlesTable = sqliteTable("articles", {
  id: text().primaryKey(),
  authorId: text()
    .notNull()
    .references(() => usersTable.id),
  title: text().notNull(),
  body: text().notNull(),
  /** null while a draft */
  publishedAt: integer({ mode: "timestamp_ms" }),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull(),
});
