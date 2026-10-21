/**
 * /articles/:id/comments from the comment form. Always back to the article (303):
 * when the comment fails, with the reason and what was typed (lib/flash.ts)
 */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleIdSchema } from "../../../../domains/articles/model";
import { ArticleNotPublished, commentInputSchema } from "../../../../domains/comments/model";
import { factory } from "../../../../factory";
import { back } from "../../../../lib/flash";
import { requireUserOnScreen } from "../../../../middleware/auth";

const params = sValidator("param", z.object({ id: articleIdSchema }));

const articleOf = (id: string) => `/articles/${id}`;

/** What the screen says for each failure of comments.create. A new failure is a type error here */
const reasons: Record<typeof ArticleNotPublished.code, string> = {
  ARTICLE_NOT_PUBLISHED: "公開中の記事にだけコメントできます。",
};

export const POST = factory.createHandlers(
  requireUserOnScreen,
  params,
  sValidator("form", commentInputSchema, (result, c) => {
    // The path of this file always has :id
    if (!result.success)
      return back(c, articleOf(c.req.param("id")!), {
        errors: { body: "コメントは 1〜1000 文字で書いてください。" },
        old: { body: String(result.data.body ?? "") },
      });
  }),
  async (c) => {
    const { articleCommentsQueries, comments } = c.var.deps;
    const { id } = c.req.valid("param");
    const article = await articleCommentsQueries.article(id);
    if (!article) return c.notFound();

    const input = c.req.valid("form");
    const created = await comments.create({ article, author: c.var.actor }, input, new Date());
    if (!created.ok)
      return back(c, articleOf(id), { errors: { body: reasons[created.error] }, old: input });

    return c.redirect(articleOf(id), 303);
  },
);
