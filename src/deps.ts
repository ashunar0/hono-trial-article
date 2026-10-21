/**
 * Wires every domain to one db. Entry points get these through c.var.deps (see app.ts):
 * services to write, readDb for the queries
 */
import type { Db, ReadDb } from "./db";
import { articlesRepository } from "./domains/articles/repo";
import { articlesService } from "./domains/articles/service";
import { commentsRepository } from "./domains/comments/repo";
import { commentsService } from "./domains/comments/service";
import { usersRepository } from "./domains/users/repo";
import { usersService } from "./domains/users/service";

export function makeDeps(db: Db) {
  return {
    readDb: db as ReadDb,
    users: usersService(usersRepository(db)),
    articles: articlesService(articlesRepository(db)),
    comments: commentsService(commentsRepository(db)),
  };
}

export type Deps = ReturnType<typeof makeDeps>;
