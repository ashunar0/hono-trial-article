import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { articlesTable } from "../articles/table";
import { usersTable } from "../users/table";

export const commentsTable = sqliteTable("comments", {
  id: text().primaryKey(),
  articleId: text()
    .notNull()
    .references(() => articlesTable.id, { onDelete: "cascade" }),
  authorId: text()
    .notNull()
    .references(() => usersTable.id),
  body: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
});
