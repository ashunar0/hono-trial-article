/** The steps for articles (How) */
import { NotFound } from "../../lib/failures";
import { err, ok, type Result } from "../../lib/result";
import type { UserId } from "../users/model";
import {
  AlreadyPublished,
  isPublished,
  newArticleId,
  NotPublished,
  type Article,
  type ArticleChanges,
  type ArticleId,
  type ArticleInput,
} from "./model";

export type ArticlesRepository = {
  /** null if absent */
  find(id: ArticleId): Promise<Article | null>;
  insert(article: Article): Promise<Article>;
  /** null if absent */
  update(id: ArticleId, changes: ArticleChanges, now: Date): Promise<Article | null>;
  /** false if absent */
  delete(id: ArticleId): Promise<boolean>;
  /** Publishes only a draft, in one statement. null if absent or published already */
  markPublished(id: ArticleId, now: Date): Promise<Article | null>;
  /** Back to a draft, only if published, in one statement. null if absent or a draft */
  markDraft(id: ArticleId, now: Date): Promise<Article | null>;
};

/**
 * Who writes the article. The user belongs to another domain,
 * so the entry point reads them and hands them in
 */
export type Authoring = {
  author: { id: UserId };
};

export function articlesService(repo: ArticlesRepository) {
  return {
    /** Every article starts as a draft */
    async create({ author }: Authoring, input: ArticleInput, now: Date): Promise<Article> {
      return repo.insert({
        id: newArticleId(),
        authorId: author.id,
        ...input,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    },

    async update(
      id: ArticleId,
      changes: ArticleChanges,
      now: Date,
    ): Promise<Result<Article, typeof NotFound.code>> {
      const updated = await repo.update(id, changes, now);

      return updated ? ok(updated) : err(NotFound.code);
    },

    async remove(id: ArticleId): Promise<Result<void, typeof NotFound.code>> {
      return (await repo.delete(id)) ? ok(undefined) : err(NotFound.code);
    },

    async publish(
      id: ArticleId,
      now: Date,
    ): Promise<Result<Article, typeof NotFound.code | typeof AlreadyPublished.code>> {
      const found = await repo.find(id);
      if (!found) return err(NotFound.code);
      if (isPublished(found)) return err(AlreadyPublished.code);

      // Another request may have published it in between
      const published = await repo.markPublished(id, now);

      return published ? ok(published) : err(AlreadyPublished.code);
    },

    async unpublish(
      id: ArticleId,
      now: Date,
    ): Promise<Result<Article, typeof NotFound.code | typeof NotPublished.code>> {
      const found = await repo.find(id);
      if (!found) return err(NotFound.code);
      if (!isPublished(found)) return err(NotPublished.code);

      const draft = await repo.markDraft(id, now);

      return draft ? ok(draft) : err(NotPublished.code);
    },
  };
}
