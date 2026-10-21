/** /articles/:id: one published article */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleIdSchema } from "../../../domains/articles/model";
import { factory } from "../../../factory";
import { ArticleScreen } from "./_screen";

export const GET = factory.createHandlers(
  sValidator("param", z.object({ id: articleIdSchema })),
  async (c) => {
    const { articlesQueries, articleCommentsQueries } = c.var.deps;
    const { id } = c.req.valid("param");
    const article = await articlesQueries.get(id);
    if (!article) return c.notFound();

    return c.html(
      <ArticleScreen article={article} comments={await articleCommentsQueries.list(id)} />,
    );
  },
);
