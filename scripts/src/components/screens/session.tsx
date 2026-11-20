/** Choose whom to be */
import { Layout } from "../layout";

export type SessionScreenProps = {
  users: { id: string; name: string }[];
  current: string | undefined;
};

export function SessionScreen({ users, current }: SessionScreenProps) {
  return (
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
    </Layout>
  );
}
