/** The reads for /articles/:id/comments */
import { asc, eq } from "drizzle-orm";
import type { ReadDb } from "../../../../db";
import { isPublished, type ArticleId } from "../../../../domains/articles/model";
import { articlesWithin } from "../../../../domains/articles/repo";
import { commentsWithin } from "../../../../domains/comments/repo";
import { usersWithin } from "../../../../domains/users/repo";

export function articleCommentsQueries(db: ReadDb) {
  return {
    /** The article in the URL the comments hang on, drafts too. null if absent */
    async article(id: ArticleId) {
      const articles = articlesWithin(db);
      const [row] = await db
        .select({ id: articles.id, publishedAt: articles.publishedAt })
        .from(articles)
        .where(eq(articles.id, id));

      return row ? { id: row.id, published: isPublished(row) } : null;
    },

    /** Oldest first, with who wrote each */
    async list(articleId: string) {
      const comments = commentsWithin(db);
      const authors = usersWithin(db);

      return db
        .select({
          id: comments.id,
          body: comments.body,
          createdAt: comments.createdAt,
          author: { id: authors.id, name: authors.name },
        })
        .from(comments)
        .innerJoin(authors, eq(authors.id, comments.authorId))
        .where(eq(comments.articleId, articleId))
        .orderBy(asc(comments.createdAt), asc(comments.id));
    },
  };
}
