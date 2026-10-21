/** /articles/:id */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleChangesSchema, articleIdSchema } from "../../../domains/articles/model";
import { factory } from "../../../factory";
import { NotFound } from "../../../lib/failures";
import { failed } from "../../../lib/http";
import { articleOf } from "../_queries";

const params = sValidator("param", z.object({ id: articleIdSchema }));

export const GET = factory.createHandlers(params, async (c) => {
  const article = await articleOf(c.var.deps.readDb, c.req.valid("param").id);
  if (!article) return failed(c, NotFound.code);

  return c.json({ article });
});

export const PATCH = factory.createHandlers(
  params,
  sValidator("json", articleChangesSchema),
  async (c) => {
    const updated = await c.var.deps.articles.update(
      c.req.valid("param").id,
      c.req.valid("json"),
      new Date(),
    );
    if (!updated.ok) return failed(c, updated.error);

    return c.json({ article: updated.value });
  },
);

export const DELETE = factory.createHandlers(params, async (c) => {
  const removed = await c.var.deps.articles.remove(c.req.valid("param").id);
  if (!removed.ok) return failed(c, removed.error);

  return c.body(null, 204);
});
