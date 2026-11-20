/**
 * Who is asking. A stand-in for real authentication: the API names the user in x-user-id,
 * a browser in the "user" cookie (set by /session). Handlers after these read c.var.actor
 */
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../factory";
import type { Actor } from "./_queries";

type WithActor = AppEnv & { Variables: { actor: Actor } };

const actorOf = async (c: Context<WithActor>) => {
  const id = c.req.header("x-user-id") ?? getCookie(c, "user");

  return id ? c.var.deps.authQueries.userOf(id) : null;
};

/** For the API: 401 when nobody asks */
export const requireUser = createMiddleware<WithActor>(async (c, next) => {
  const actor = await actorOf(c);
  if (!actor) return c.json({ error: "UNAUTHENTICATED" }, 401);

  c.set("actor", actor);
  await next();
});

/** For a screen: to /session when nobody asks */
export const requireUserOnScreen = createMiddleware<WithActor>(async (c, next) => {
  const actor = await actorOf(c);
  if (!actor) return c.redirect("/session", 303);

  c.set("actor", actor);
  await next();
});
