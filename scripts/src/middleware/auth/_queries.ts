/** The reads authentication needs: who is asking */
import { eq } from "drizzle-orm";
import type { ReadDb } from "../../db";
import { userId } from "../../domains/users/model";
import { usersWithin } from "../../domains/users/repo";

export function authQueries(db: ReadDb) {
  return {
    /** null if absent */
    async userOf(id: string) {
      const users = usersWithin(db);
      const [row] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, id));

      return row ? { ...row, id: userId(row.id) } : null;
    },
  };
}

export type Actor = NonNullable<Awaited<ReturnType<ReturnType<typeof authQueries>["userOf"]>>>;
