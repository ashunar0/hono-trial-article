/** An article: written as a draft, then published (What) */
import { z } from "zod";
import type { UserId } from "../users/model";

declare const articleIdBrand: unique symbol;
export type ArticleId = string & { readonly [articleIdBrand]: true };
export const articleId = (value: string) => value as ArticleId;
export const newArticleId = () => articleId(crypto.randomUUID());
export const articleIdSchema = z.string().min(1).transform(articleId);

export type Article = {
  id: ArticleId;
  authorId: UserId;
  title: string;
  body: string;
  /** null while a draft */
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const articleInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  body: z.string().min(1),
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

export const articleChangesSchema = articleInputSchema.partial();
export type ArticleChanges = z.infer<typeof articleChangesSchema>;

/** What "published" means. publishedArticlesWithin (repo.ts) says the same in SQL */
export const isPublished = (article: Pick<Article, "publishedAt">) => article.publishedAt !== null;

export const AlreadyPublished = {
  code: "ALREADY_PUBLISHED",
  message: "The article is published already",
} as const;

export const NotPublished = {
  code: "NOT_PUBLISHED",
  message: "The article is not published",
} as const;
