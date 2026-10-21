/** /users/:id/articles: what one user has published. Same domain as /articles, another resource */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { userIdSchema } from "../../../../domains/users/model";
import { factory } from "../../../../factory";
import { NotFound } from "../../../../lib/failures";
import { failed } from "../../../../lib/http";

export const GET = factory.createHandlers(
  sValidator("param", z.object({ id: userIdSchema })),
  async (c) => {
    const { userArticlesQueries } = c.var.deps;
    const { id } = c.req.valid("param");
    const user = await userArticlesQueries.user(id);
    if (!user) return failed(c, NotFound.code);

    return c.json({ user, articles: await userArticlesQueries.list(id) });
  },
);
