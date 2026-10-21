/**
 * Wires every domain and every queries to one db. Entry points get these through c.var.deps (see app.ts):
 * services to write, queries to read. No db is handed out, not even one that only reads,
 * so a handler can only call named functions.
 * The queries lines are what a route generator would write from the _queries.ts files
 */
import type { Db } from "./db";
import { articlesRepository } from "./domains/articles/repo";
import { articlesService } from "./domains/articles/service";
import { commentsRepository } from "./domains/comments/repo";
import { commentsService } from "./domains/comments/service";
import { usersRepository } from "./domains/users/repo";
import { usersService } from "./domains/users/service";
import { authQueries } from "./middleware/auth/_queries";
import { articlesQueries } from "./routes/articles/_queries";
import { articleCommentsQueries } from "./routes/articles/[id]/comments/_queries";
import { userArticlesQueries } from "./routes/users/[id]/articles/_queries";

export function makeDeps(db: Db) {
  return {
    users: usersService(usersRepository(db)),
    articles: articlesService(articlesRepository(db)),
    comments: commentsService(commentsRepository(db)),
    authQueries: authQueries(db),
    articlesQueries: articlesQueries(db),
    articleCommentsQueries: articleCommentsQueries(db),
    userArticlesQueries: userArticlesQueries(db),
  };
}

export type Deps = ReturnType<typeof makeDeps>;
