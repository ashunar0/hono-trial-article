/** The reads for /session: whom one can be */
import { asc, eq } from "drizzle-orm";
import type { ReadDb } from "../../db";
import { usersWithin } from "../../domains/users/repo";

export function sessionQueries(db: ReadDb) {
  return {
    /** Oldest first */
    async users() {
      const users = usersWithin(db);

      return db
        .select({ id: users.id, name: users.name })
        .from(users)
        .orderBy(asc(users.createdAt), asc(users.id));
    },

    async exists(id: string) {
      const users = usersWithin(db);
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));

      return row !== undefined;
    },
  };
}
