/** /articles/:id/comments: a child resource of articles. The domain is comments */
import { sValidator } from "@hono/standard-validator";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { ReadDb } from "../../../../db";
import { articleIdSchema, isPublished, type ArticleId } from "../../../../domains/articles/model";
import { articlesWithin } from "../../../../domains/articles/repo";
import { commentInputSchema } from "../../../../domains/comments/model";
import { commentsWithin } from "../../../../domains/comments/repo";
import { userIdSchema, type UserId } from "../../../../domains/users/model";
import { usersWithin } from "../../../../domains/users/repo";
import { factory } from "../../../../factory";
import { NotFound } from "../../../../lib/failures";
import { failed, unknownIn } from "../../../../lib/http";

// Only this resource reads these, so they are written here

/** The article the comments hang on, drafts too. null if absent */
const articleOf = async (db: ReadDb, id: ArticleId) => {
  const articles = articlesWithin(db);
  const [row] = await db
    .select({ id: articles.id, publishedAt: articles.publishedAt })
    .from(articles)
    .where(eq(articles.id, id));

  return row ? { id: row.id, published: isPublished(row) } : null;
};

/** The author a comment is written by. null if absent */
const authorOf = async (db: ReadDb, id: UserId) => {
  const users = usersWithin(db);
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));

  return row ? { id } : null;
};

/** Oldest first, with who wrote each */
const commentsOn = async (db: ReadDb, articleId: string) => {
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
};

const params = sValidator("param", z.object({ id: articleIdSchema }));

export const GET = factory.createHandlers(params, async (c) => {
  const { readDb } = c.var.deps;
  const article = await articleOf(readDb, c.req.valid("param").id);
  // A draft's comments are as absent as the draft itself
  if (!article?.published) return failed(c, NotFound.code);

  return c.json({ comments: await commentsOn(readDb, article.id) });
});

export const POST = factory.createHandlers(
  params,
  sValidator("json", commentInputSchema.extend({ authorId: userIdSchema })),
  async (c) => {
    const { readDb, comments } = c.var.deps;
    const { authorId, ...input } = c.req.valid("json");
    const article = await articleOf(readDb, c.req.valid("param").id);
    if (!article) return failed(c, NotFound.code);
    const author = await authorOf(readDb, authorId);
    if (!author) return unknownIn(c, "authorId");

    const created = await comments.create({ article, author }, input, new Date());
    if (!created.ok) return failed(c, created.error);

    return c.json({ comment: created.value }, 201);
  },
);
