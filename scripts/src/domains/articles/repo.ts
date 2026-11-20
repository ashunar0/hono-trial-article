/** Storage for articles. Row shapes never leave this file */
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db, ReadDb } from "../../db";
import { userId } from "../users/model";
import { articleId, type Article } from "./model";
import type { ArticlesRepository } from "./service";
import { articlesTable } from "./table";

const toArticle = (row: typeof articlesTable.$inferSelect): Article => ({
  ...row,
  id: articleId(row.id),
  authorId: userId(row.authorId),
});

/** Every article, drafts too, as a table to read */
export const articlesWithin = (db: ReadDb) =>
  db.select().from(articlesTable).as("articles_within");

/** Published articles only. What "published" means is decided here (and in isPublished) */
export const publishedArticlesWithin = (db: ReadDb) =>
  db
    .select()
    .from(articlesTable)
    .where(isNotNull(articlesTable.publishedAt))
    .as("published_articles");

export function articlesRepository(db: Db): ArticlesRepository {
  const one = (rows: (typeof articlesTable.$inferSelect)[]) => (rows[0] ? toArticle(rows[0]) : null);

  return {
    async find(id) {
      return one(await db.select().from(articlesTable).where(eq(articlesTable.id, id)));
    },

    async insert(article) {
      const [row] = await db.insert(articlesTable).values(article).returning();
      if (!row) throw new Error(`article ${article.id} was not returned after insert`);

      return toArticle(row);
    },

    async update(id, changes, now) {
      return one(
        await db
          .update(articlesTable)
          .set({ ...changes, updatedAt: now })
          .where(eq(articlesTable.id, id))
          .returning(),
      );
    },

    async delete(id) {
      const rows = await db
        .delete(articlesTable)
        .where(eq(articlesTable.id, id))
        .returning({ id: articlesTable.id });

      return rows.length > 0;
    },

    async markPublished(id, now) {
      return one(
        await db
          .update(articlesTable)
          .set({ publishedAt: now, updatedAt: now })
          .where(and(eq(articlesTable.id, id), isNull(articlesTable.publishedAt)))
          .returning(),
      );
    },

    async markDraft(id, now) {
      return one(
        await db
          .update(articlesTable)
          .set({ publishedAt: null, updatedAt: now })
          .where(and(eq(articlesTable.id, id), isNotNull(articlesTable.publishedAt)))
          .returning(),
      );
    },
  };
}
