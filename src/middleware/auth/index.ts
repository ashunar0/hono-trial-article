/**
 * Who is asking. A stand-in for real authentication: the request names the user in x-user-id.
 * Handlers after requireUser read c.var.actor
 */
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../factory";
import type { Actor } from "./_queries";

export const requireUser = createMiddleware<AppEnv & { Variables: { actor: Actor } }>(
  async (c, next) => {
    const id = c.req.header("x-user-id");
    const actor = id ? await c.var.deps.authQueries.userOf(id) : null;
    if (!actor) return c.json({ error: "UNAUTHENTICATED" }, 401);

    c.set("actor", actor);
    await next();
  },
);
