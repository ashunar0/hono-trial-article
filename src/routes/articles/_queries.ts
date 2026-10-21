/**
 * The reads /articles and /articles/:id share: a published article with its author and comment count.
 * Drafts never show here: publishedArticlesWithin decides that
 */
import { desc, eq } from "drizzle-orm";
import type { ReadDb } from "../../db";
import type { ArticleId } from "../../domains/articles/model";
import { publishedArticlesWithin } from "../../domains/articles/repo";
import { commentCountByArticleWithin } from "../../domains/comments/repo";
import { usersWithin } from "../../domains/users/repo";

const seen = (db: ReadDb) => {
  const articles = publishedArticlesWithin(db);
  const authors = usersWithin(db);
  const counts = commentCountByArticleWithin(db);
  const query = db
    .select({
      id: articles.id,
      title: articles.title,
      body: articles.body,
      publishedAt: articles.publishedAt,
      author: { id: authors.id, name: authors.name },
      commentCount: counts.commentCount,
    })
    .from(articles)
    .innerJoin(authors, eq(authors.id, articles.authorId))
    .leftJoin(counts, eq(counts.articleId, articles.id));

  return { articles, query };
};

type Row = Awaited<ReturnType<typeof seen>["query"]>[number];

const withCount = (row: Row) => ({ ...row, commentCount: row.commentCount ?? 0 });

export function articlesQueries(db: ReadDb) {
  return {
    /** Newest first */
    async list() {
      const { articles, query } = seen(db);
      const rows = await query.orderBy(desc(articles.publishedAt), desc(articles.id));

      return rows.map(withCount);
    },

    /** null if absent or a draft */
    async get(id: ArticleId) {
      const { articles, query } = seen(db);
      const [row] = await query.where(eq(articles.id, id)).limit(1);

      return row ? withCount(row) : null;
    },
  };
}
