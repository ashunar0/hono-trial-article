/**
 * The screen of one article: the article, its comments and the comment form.
 * /articles/:id shows it; /articles/:id/comments shows it again when a comment fails
 */
import { Layout } from "../../../components/layout";
import type { articleCommentsQueries } from "./comments/_queries";
import type { articlesQueries } from "../_queries";

type Article = NonNullable<Awaited<ReturnType<ReturnType<typeof articlesQueries>["get"]>>>;
type Comments = Awaited<ReturnType<ReturnType<typeof articleCommentsQueries>["list"]>>;

export function ArticleScreen({
  article,
  comments,
  error,
  draft,
}: {
  article: Article;
  comments: Comments;
  /** Why the last comment was not taken */
  error?: string;
  /** What was typed, kept when the comment failed */
  draft?: string;
}) {
  return (
    <Layout title={article.title}>
      <p class="muted">{article.author.name}</p>
      <p>{article.body}</p>

      <h2>コメント（{article.commentCount}）</h2>
      <ul>
        {comments.map((comment) => (
          <li>
            {comment.body} <span class="muted">{comment.author.name}</span>
          </li>
        ))}
      </ul>

      <form method="post" action={`/articles/${article.id}/comments`}>
        {error ? <p class="error">{error}</p> : null}
        <textarea name="body">{draft}</textarea>
        <button>コメントする</button>
      </form>
    </Layout>
  );
}
