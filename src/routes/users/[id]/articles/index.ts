/** /users/:id/articles: what one user has published. Same domain as /articles, another resource */
import { sValidator } from "@hono/standard-validator";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { ReadDb } from "../../../../db";
import { publishedArticlesWithin } from "../../../../domains/articles/repo";
import { commentCountByArticleWithin } from "../../../../domains/comments/repo";
import { userIdSchema, type UserId } from "../../../../domains/users/model";
import { usersWithin } from "../../../../domains/users/repo";
import { factory } from "../../../../factory";
import { failed } from "../../../../lib/http";
import { NotFound } from "../../../../lib/failures";

// Only this endpoint reads these, so they are written here

const userOf = async (db: ReadDb, id: UserId) => {
  const users = usersWithin(db);
  const [row] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, id));

  return row ?? null;
};

const articlesBy = async (db: ReadDb, authorId: UserId) => {
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
};

export const GET = factory.createHandlers(
  sValidator("param", z.object({ id: userIdSchema })),
  async (c) => {
    const { readDb } = c.var.deps;
    const { id } = c.req.valid("param");
    const user = await userOf(readDb, id);
    if (!user) return failed(c, NotFound.code);

    return c.json({ user, articles: await articlesBy(readDb, id) });
  },
);
