/** /articles/:id: one published article. Shows what the comment form left when it failed */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { ArticleScreen } from "../../../components/screens/article";
import { articleIdSchema } from "../../../domains/articles/model";
import { factory } from "../../../factory";
import { takeFlash } from "../../../lib/flash";

export const GET = factory.createHandlers(
  sValidator("param", z.object({ id: articleIdSchema })),
  async (c) => {
    const { articlesQueries, articleCommentsQueries } = c.var.deps;
    const { id } = c.req.valid("param");
    const article = await articlesQueries.get(id);
    if (!article) return c.notFound();

    return c.html(
      <ArticleScreen
        article={article}
        comments={await articleCommentsQueries.list(id)}
        {...takeFlash(c)}
      />,
    );
  },
);
