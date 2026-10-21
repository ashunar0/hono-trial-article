/** The app. Routes come from src/routes through routes.gen.ts (`pnpm gen`) */
import { Hono } from "hono";
import type { Deps } from "./deps";
import type { AppEnv } from "./factory";
import { registerRoutes } from "./routes.gen";

export function createApp(deps: Deps) {
  const app = new Hono<AppEnv>();

  app.use(async (c, next) => {
    c.set("deps", deps);
    await next();
  });
  registerRoutes(app);

  return app;
}
