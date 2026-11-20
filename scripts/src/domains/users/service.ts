/** The steps for users (How) */
import { newUserId, type User, type UserInput } from "./model";

export type UsersRepository = {
  insert(user: User): Promise<User>;
};

export function usersService(repo: UsersRepository) {
  return {
    /** Nothing can fail here yet, so it returns the user itself */
    async create(input: UserInput, now: Date): Promise<User> {
      return repo.insert({ id: newUserId(), ...input, createdAt: now });
    },
  };
}
