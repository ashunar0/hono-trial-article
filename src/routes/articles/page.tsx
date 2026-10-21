/** /articles: the published articles */
import { Layout } from "../../components/layout";
import { factory } from "../../factory";

export const GET = factory.createHandlers(async (c) => {
  const articles = await c.var.deps.articlesQueries.list();

  return c.html(
    <Layout title="記事">
      {articles.length === 0 ? <p>まだ公開された記事はありません。</p> : null}
      <ul>
        {articles.map((article) => (
          <li>
            <a href={`/articles/${article.id}`}>{article.title}</a>{" "}
            <span class="muted">
              {article.author.name}・コメント {article.commentCount}
            </span>
          </li>
        ))}
      </ul>
    </Layout>,
  );
});
