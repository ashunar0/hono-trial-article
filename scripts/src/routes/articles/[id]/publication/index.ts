/**
 * /articles/:id/publication: publishing as a resource. POST publishes, DELETE takes it back to a draft.
 * There is no publications domain: the rules are articles'
 */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleIdSchema } from "../../../../domains/articles/model";
import { factory } from "../../../../factory";
import { failed } from "../../../../lib/http";

const params = sValidator("param", z.object({ id: articleIdSchema }));

export const POST = factory.createHandlers(params, async (c) => {
  const published = await c.var.deps.articles.publish(c.req.valid("param").id, new Date());
  if (!published.ok) return failed(c, published.error);

  return c.json({ article: published.value }, 201);
});

export const DELETE = factory.createHandlers(params, async (c) => {
  const draft = await c.var.deps.articles.unpublish(c.req.valid("param").id, new Date());
  if (!draft.ok) return failed(c, draft.error);

  return c.json({ article: draft.value });
});
