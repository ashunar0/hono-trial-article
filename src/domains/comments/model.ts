/** A comment on an article (What) */
import { z } from "zod";
import type { UserId } from "../users/model";

declare const commentIdBrand: unique symbol;
export type CommentId = string & { readonly [commentIdBrand]: true };
export const commentId = (value: string) => value as CommentId;
export const newCommentId = () => commentId(crypto.randomUUID());

export type Comment = {
  id: CommentId;
  articleId: string;
  authorId: UserId;
  body: string;
  createdAt: Date;
};

export const commentInputSchema = z.strictObject({
  body: z.string().trim().min(1).max(1000),
});
export type CommentInput = z.infer<typeof commentInputSchema>;

export const ArticleNotPublished = {
  code: "ARTICLE_NOT_PUBLISHED",
  message: "Comments are only for published articles",
} as const;
