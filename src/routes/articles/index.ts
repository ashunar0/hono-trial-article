/** /articles */
import { sValidator } from "@hono/standard-validator";
import { articleInputSchema } from "../../domains/articles/model";
import { factory } from "../../factory";
import { requireUser } from "../../middleware/auth";

export const GET = factory.createHandlers(async (c) =>
  c.json({ articles: await c.var.deps.articlesQueries.list() }),
);

export const POST = factory.createHandlers(
  requireUser,
  sValidator("json", articleInputSchema),
  async (c) => {
    const article = await c.var.deps.articles.create(
      { author: c.var.actor },
      c.req.valid("json"),
      new Date(),
    );

    return c.json({ article }, 201);
  },
);
