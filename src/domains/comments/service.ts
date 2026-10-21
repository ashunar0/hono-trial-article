/** The steps for comments (How) */
import { err, ok, type Result } from "../../lib/result";
import type { UserId } from "../users/model";
import { ArticleNotPublished, newCommentId, type Comment, type CommentInput } from "./model";

export type CommentsRepository = {
  insert(comment: Comment): Promise<Comment>;
};

/**
 * What a comment is decided from: the article and who writes. Both belong to other domains,
 * so the entry point reads them and hands them in. Whether the article is published is
 * articles' rule (isPublished); the entry point asks it, not this domain
 */
export type Commenting = {
  article: { id: string; published: boolean };
  author: { id: UserId };
};

export function commentsService(repo: CommentsRepository) {
  return {
    async create(
      { article, author }: Commenting,
      input: CommentInput,
      now: Date,
    ): Promise<Result<Comment, typeof ArticleNotPublished.code>> {
      if (!article.published) return err(ArticleNotPublished.code);

      return ok(
        await repo.insert({
          id: newCommentId(),
          articleId: article.id,
          authorId: author.id,
          ...input,
          createdAt: now,
        }),
      );
    },
  };
}
