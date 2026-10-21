/** /articles */
import { sValidator } from "@hono/standard-validator";
import { eq } from "drizzle-orm";
import type { ReadDb } from "../../db";
import { articleInputSchema } from "../../domains/articles/model";
import { userIdSchema, type UserId } from "../../domains/users/model";
import { usersWithin } from "../../domains/users/repo";
import { factory } from "../../factory";
import { unknownIn } from "../../lib/http";
import { articleList } from "./_queries";

/** The author an article is written by. null if absent */
const authorOf = async (db: ReadDb, id: UserId) => {
  const users = usersWithin(db);
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));

  return row ? { id } : null;
};

export const GET = factory.createHandlers(async (c) =>
  c.json({ articles: await articleList(c.var.deps.readDb) }),
);

export const POST = factory.createHandlers(
  sValidator("json", articleInputSchema.extend({ authorId: userIdSchema })),
  async (c) => {
    const { readDb, articles } = c.var.deps;
    const { authorId, ...input } = c.req.valid("json");
    const author = await authorOf(readDb, authorId);
    if (!author) return unknownIn(c, "authorId");

    const article = await articles.create({ author }, input, new Date());

    return c.json({ article }, 201);
  },
);
