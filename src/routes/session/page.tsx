/** /session: choose whom to be. A stand-in for signing in */
import { sValidator } from "@hono/standard-validator";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { Layout } from "../../components/layout";
import { factory } from "../../factory";

export const GET = factory.createHandlers(async (c) => {
  const users = await c.var.deps.sessionQueries.users();
  const current = getCookie(c, "user");

  return c.html(
    <Layout title="誰として使うか">
      <form method="post" action="/session">
        <select name="userId">
          {users.map((user) => (
            <option value={user.id} selected={user.id === current}>
              {user.name}
            </option>
          ))}
        </select>{" "}
        <button>この人で使う</button>
      </form>
    </Layout>,
  );
});

export const POST = factory.createHandlers(
  sValidator("form", z.object({ userId: z.string().min(1) })),
  async (c) => {
    const { userId } = c.req.valid("form");
    if (!(await c.var.deps.sessionQueries.exists(userId))) return c.redirect("/session", 303);

    setCookie(c, "user", userId, { httpOnly: true, sameSite: "Lax", path: "/" });

    return c.redirect("/articles", 303);
  },
);
