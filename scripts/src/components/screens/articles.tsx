/** The published articles */
import { Layout } from "../layout";

export type ArticlesScreenProps = {
  articles: { id: string; title: string; author: { name: string }; commentCount: number }[];
};

export function ArticlesScreen({ articles }: ArticlesScreenProps) {
  return (
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
    </Layout>
  );
}
