/**
 * /articles/:id/comments from the comment form: back to the article when taken (303),
 * the article again with the reason when not (422)
 */
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import { articleIdSchema } from "../../../../domains/articles/model";
import { ArticleNotPublished, commentInputSchema } from "../../../../domains/comments/model";
import { factory } from "../../../../factory";
import { requireUserOnScreen } from "../../../../middleware/auth";
import { ArticleScreen } from "../_screen";

const params = sValidator("param", z.object({ id: articleIdSchema }));

/** What the screen says for each failure of comments.create. A new failure is a type error here */
const reasons: Record<typeof ArticleNotPublished.code, string> = {
  ARTICLE_NOT_PUBLISHED: "公開中の記事にだけコメントできます。",
};

export const POST = factory.createHandlers(
  requireUserOnScreen,
  params,
  // Read the form loosely here; the comment's own rules are checked below, to show them on the screen
  sValidator("form", z.object({ body: z.string() })),
  async (c) => {
    const { articlesQueries, articleCommentsQueries, comments } = c.var.deps;
    const { id } = c.req.valid("param");
    const { body } = c.req.valid("form");

    const again = async (error: string) => {
      const article = await articlesQueries.get(id);
      if (!article) return c.notFound();

      return c.html(
        <ArticleScreen
          article={article}
          comments={await articleCommentsQueries.list(id)}
          error={error}
          draft={body}
        />,
        422,
      );
    };

    const input = commentInputSchema.safeParse({ body });
    if (!input.success) return again("コメントは 1〜1000 文字で書いてください。");

    const article = await articleCommentsQueries.article(id);
    if (!article) return c.notFound();
    const created = await comments.create({ article, author: c.var.actor }, input.data, new Date());
    if (!created.ok) return again(reasons[created.error]);

    return c.redirect(`/articles/${id}`, 303);
  },
);
