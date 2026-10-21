/** Storage for users. Row shapes never leave this file */
import type { Db, ReadDb } from "../../db";
import { userId, type User } from "./model";
import type { UsersRepository } from "./service";
import { usersTable } from "./table";

const toUser = (row: typeof usersTable.$inferSelect): User => ({ ...row, id: userId(row.id) });

/** Every user, as a table to read */
export const usersWithin = (db: ReadDb) => db.select().from(usersTable).as("users_within");

export function usersRepository(db: Db): UsersRepository {
  return {
    async insert(user) {
      const [row] = await db.insert(usersTable).values(user).returning();
      if (!row) throw new Error(`user ${user.id} was not returned after insert`);

      return toUser(row);
    },
  };
}
