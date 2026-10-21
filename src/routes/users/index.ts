/** /users */
import { sValidator } from "@hono/standard-validator";
import { userInputSchema } from "../../domains/users/model";
import { factory } from "../../factory";

export const POST = factory.createHandlers(sValidator("json", userInputSchema), async (c) => {
  const user = await c.var.deps.users.create(c.req.valid("json"), new Date());

  return c.json({ user }, 201);
});
