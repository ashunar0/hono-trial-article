/** /articles/:id/comments: a child resource of articles. The domain is comments */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleIdSchema } from "../../../../domains/articles/model";
import { commentInputSchema } from "../../../../domains/comments/model";
import { factory } from "../../../../factory";
import { NotFound } from "../../../../lib/failures";
import { failed } from "../../../../lib/http";
import { requireUser } from "../../../../middleware/auth";

const params = sValidator("param", z.object({ id: articleIdSchema }));

export const GET = factory.createHandlers(params, async (c) => {
  const { articleCommentsQueries } = c.var.deps;
  const article = await articleCommentsQueries.article(c.req.valid("param").id);
  // A draft's comments are as absent as the draft itself
  if (!article?.published) return failed(c, NotFound.code);

  return c.json({ comments: await articleCommentsQueries.list(article.id) });
});

export const POST = factory.createHandlers(
  requireUser,
  params,
  sValidator("json", commentInputSchema),
  async (c) => {
    const { articleCommentsQueries, comments } = c.var.deps;
    const article = await articleCommentsQueries.article(c.req.valid("param").id);
    if (!article) return failed(c, NotFound.code);

    const created = await comments.create(
      { article, author: c.var.actor },
      c.req.valid("json"),
      new Date(),
    );
    if (!created.ok) return failed(c, created.error);

    return c.json({ comment: created.value }, 201);
  },
);
