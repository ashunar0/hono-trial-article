/** Storage for comments. Row shapes never leave this file */
import { count } from "drizzle-orm";
import type { Db, ReadDb } from "../../db";
import { userId } from "../users/model";
import { commentId, type Comment } from "./model";
import type { CommentsRepository } from "./service";
import { commentsTable } from "./table";

const toComment = (row: typeof commentsTable.$inferSelect): Comment => ({
  ...row,
  id: commentId(row.id),
  authorId: userId(row.authorId),
});

/** Every comment, as a table to read */
export const commentsWithin = (db: ReadDb) =>
  db.select().from(commentsTable).as("comments_within");

/** How many comments each article has (articles with none are absent) */
export const commentCountByArticleWithin = (db: ReadDb) =>
  db
    .select({ articleId: commentsTable.articleId, commentCount: count().as("comment_count") })
    .from(commentsTable)
    .groupBy(commentsTable.articleId)
    .as("comment_count_by_article");

export function commentsRepository(db: Db): CommentsRepository {
  return {
    async insert(comment) {
      const [row] = await db.insert(commentsTable).values(comment).returning();
      if (!row) throw new Error(`comment ${comment.id} was not returned after insert`);

      return toComment(row);
    },
  };
}
