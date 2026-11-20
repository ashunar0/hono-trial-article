/** /session: choose whom to be. A stand-in for signing in */
import { sValidator } from "@hono/standard-validator";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { SessionScreen } from "../../components/screens/session";
import { factory } from "../../factory";

export const GET = factory.createHandlers(async (c) =>
  c.html(
    <SessionScreen
      users={await c.var.deps.sessionQueries.users()}
      current={getCookie(c, "user")}
    />,
  ),
);

export const POST = factory.createHandlers(
  sValidator("form", z.object({ userId: z.string().min(1) })),
  async (c) => {
    const { userId } = c.req.valid("form");
    if (!(await c.var.deps.sessionQueries.exists(userId))) return c.redirect("/session", 303);

    setCookie(c, "user", userId, { httpOnly: true, sameSite: "Lax", path: "/" });

    return c.redirect("/articles", 303);
  },
);
