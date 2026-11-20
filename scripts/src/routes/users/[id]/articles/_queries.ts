/** The reads for /users/:id/articles */
import { desc, eq } from "drizzle-orm";
import type { ReadDb } from "../../../../db";
import type { UserId } from "../../../../domains/users/model";
import { publishedArticlesWithin } from "../../../../domains/articles/repo";
import { commentCountByArticleWithin } from "../../../../domains/comments/repo";
import { usersWithin } from "../../../../domains/users/repo";

export function userArticlesQueries(db: ReadDb) {
  return {
    /** The user in the URL. null if absent */
    async user(id: UserId) {
      const users = usersWithin(db);
      const [row] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, id));

      return row ?? null;
    },

    /** What the user has published, newest first */
    async list(authorId: UserId) {
      const articles = publishedArticlesWithin(db);
      const counts = commentCountByArticleWithin(db);
      const rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          publishedAt: articles.publishedAt,
          commentCount: counts.commentCount,
        })
        .from(articles)
        .leftJoin(counts, eq(counts.articleId, articles.id))
        .where(eq(articles.authorId, authorId))
        .orderBy(desc(articles.publishedAt), desc(articles.id));

      return rows.map((row) => ({ ...row, commentCount: row.commentCount ?? 0 }));
    },
  };
}
