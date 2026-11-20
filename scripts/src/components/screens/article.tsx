/** One article: the article, its comments and the comment form */
import { Layout } from "../layout";

export type ArticleScreenProps = {
  article: {
    id: string;
    title: string;
    body: string;
    author: { name: string };
    commentCount: number;
  };
  comments: { id: string; body: string; author: { name: string } }[];
  /** Left by the comment form when it failed */
  errors: { body?: string };
  old: { body?: string };
};

export function ArticleScreen({ article, comments, errors, old }: ArticleScreenProps) {
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
        {errors.body ? <p class="error">{errors.body}</p> : null}
        <textarea name="body">{old.body}</textarea>
        <button>コメントする</button>
      </form>
    </Layout>
  );
}
