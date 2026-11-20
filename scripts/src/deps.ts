/**
 * Wires every domain and every queries to one db. Entry points get these through c.var.deps (see app.ts):
 * services to write, queries to read. No db is handed out, not even one that only reads,
 * so a handler can only call named functions. The queries come from the _queries.ts files (`pnpm gen`)
 */
import type { Db } from "./db";
import { articlesRepository } from "./domains/articles/repo";
import { articlesService } from "./domains/articles/service";
import { commentsRepository } from "./domains/comments/repo";
import { commentsService } from "./domains/comments/service";
import { usersRepository } from "./domains/users/repo";
import { usersService } from "./domains/users/service";
import { makeQueries } from "./routes.gen";

export function makeDeps(db: Db) {
  return {
    users: usersService(usersRepository(db)),
    articles: articlesService(articlesRepository(db)),
    comments: commentsService(commentsRepository(db)),
    ...makeQueries(db),
  };
}

export type Deps = ReturnType<typeof makeDeps>;
