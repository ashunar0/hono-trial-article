/**
 * The app. The routes below are what a route generator would write from src/routes:
 * one line per file and method, the path from the directory. Written by hand for now
 */
import { Hono } from "hono";
import type { Deps } from "./deps";
import type { AppEnv } from "./factory";
import * as articles from "./routes/articles/index";
import * as article from "./routes/articles/[id]/index";
import * as articleComments from "./routes/articles/[id]/comments/index";
import * as articlePublication from "./routes/articles/[id]/publication/index";
import * as users from "./routes/users/index";
import * as userArticles from "./routes/users/[id]/articles/index";

export function createApp(deps: Deps) {
  const app = new Hono<AppEnv>();

  app.use(async (c, next) => {
    c.set("deps", deps);
    await next();
  });

  // routes/articles/index.ts
  app.get("/articles", ...articles.GET);
  app.post("/articles", ...articles.POST);
  // routes/articles/[id]/index.ts
  app.get("/articles/:id", ...article.GET);
  app.patch("/articles/:id", ...article.PATCH);
  app.delete("/articles/:id", ...article.DELETE);
  // routes/articles/[id]/comments/index.ts
  app.get("/articles/:id/comments", ...articleComments.GET);
  app.post("/articles/:id/comments", ...articleComments.POST);
  // routes/articles/[id]/publication/index.ts
  app.post("/articles/:id/publication", ...articlePublication.POST);
  app.delete("/articles/:id/publication", ...articlePublication.DELETE);
  // routes/users/index.ts
  app.post("/users", ...users.POST);
  // routes/users/[id]/articles/index.ts
  app.get("/users/:id/articles", ...userArticles.GET);

  return app;
}
