import { beforeEach, describe, expect, test } from "vitest";
import { setup } from "./app";

let call: Awaited<ReturnType<typeof setup>>["call"];
let aliceId: string;
let bobId: string;

beforeEach(async () => {
  ({ call } = await setup());
  aliceId = (await call("POST", "/users", { body: { name: "Alice" } })).body.user.id;
  bobId = (await call("POST", "/users", { body: { name: "Bob" } })).body.user.id;
});

const draft = async (authorId: string, title = "Hello") =>
  (await call("POST", "/articles", { body: { title, body: "..." }, as: authorId })).body
    .article.id as string;

const published = async (authorId: string, title?: string) => {
  const id = await draft(authorId, title);
  await call("POST", `/articles/${id}/publication`);
  return id;
};

describe("/articles", () => {
  test("a draft is not listed nor shown", async () => {
    const id = await draft(aliceId);

    expect((await call("GET", "/articles")).body.articles).toEqual([]);
    expect((await call("GET", `/articles/${id}`)).status).toBe(404);
  });

  test("a published article is listed with its author and comment count, newest first", async () => {
    const first = await published(aliceId, "First");
    const second = await published(bobId, "Second");
    await call("POST", `/articles/${first}/comments`, { body: { body: "Nice" }, as: bobId });

    const { body } = await call("GET", "/articles");

    expect(body.articles.map((a: { id: string }) => a.id)).toEqual([second, first]);
    expect(body.articles[1]).toMatchObject({
      title: "First",
      author: { id: aliceId, name: "Alice" },
      commentCount: 1,
    });
    expect(body.articles[0].commentCount).toBe(0);
  });

  test("writing needs someone who asks", async () => {
    const body = { title: "x", body: "y" };

    expect((await call("POST", "/articles", { body })).status).toBe(401);
    expect((await call("POST", "/articles", { body, as: "nobody" })).status).toBe(401);
  });

  test("changes and deletes, 404 when absent", async () => {
    const id = await published(aliceId);

    expect((await call("PATCH", `/articles/${id}`, { body: { title: "Renamed" } })).body.article.title).toBe(
      "Renamed",
    );
    expect((await call("DELETE", `/articles/${id}`)).status).toBe(204);
    expect((await call("GET", `/articles/${id}`)).status).toBe(404);
    expect((await call("PATCH", `/articles/${id}`, { body: { title: "x" } })).status).toBe(404);
  });
});

describe("/articles/:id/publication", () => {
  test("publishes a draft once, and takes it back once", async () => {
    const id = await draft(aliceId);

    expect((await call("POST", `/articles/${id}/publication`)).status).toBe(201);
    expect(await call("POST", `/articles/${id}/publication`)).toEqual({
      status: 422,
      body: { error: "ALREADY_PUBLISHED" },
    });

    expect((await call("DELETE", `/articles/${id}/publication`)).status).toBe(200);
    expect((await call("GET", "/articles")).body.articles).toEqual([]);
    expect(await call("DELETE", `/articles/${id}/publication`)).toEqual({
      status: 422,
      body: { error: "NOT_PUBLISHED" },
    });
  });

  test("404 when absent", async () => {
    expect((await call("POST", "/articles/nope/publication")).status).toBe(404);
  });
});

describe("/articles/:id/comments", () => {
  test("only on a published article", async () => {
    const id = await draft(aliceId);

    expect(
      await call("POST", `/articles/${id}/comments`, { body: { body: "Hi" }, as: bobId }),
    ).toEqual({
      status: 422,
      body: { error: "ARTICLE_NOT_PUBLISHED" },
    });
    expect((await call("GET", `/articles/${id}/comments`)).status).toBe(404);
  });

  test("lists oldest first with who wrote each", async () => {
    const id = await published(aliceId);
    await call("POST", `/articles/${id}/comments`, { body: { body: "First" }, as: bobId });
    await call("POST", `/articles/${id}/comments`, { body: { body: "Second" }, as: aliceId });

    const { body } = await call("GET", `/articles/${id}/comments`);

    expect(body.comments.map((c: { body: string; author: { name: string } }) => [c.body, c.author.name])).toEqual([
      ["First", "Bob"],
      ["Second", "Alice"],
    ]);
  });
});

describe("/users/:id/articles", () => {
  test("only what that user has published, with comment counts", async () => {
    const mine = await published(aliceId, "Mine");
    await draft(aliceId, "My draft");
    await published(bobId, "Not mine");
    await call("POST", `/articles/${mine}/comments`, { body: { body: "Nice" }, as: bobId });

    const { body } = await call("GET", `/users/${aliceId}/articles`);

    expect(body.user).toEqual({ id: aliceId, name: "Alice" });
    expect(body.articles).toMatchObject([{ id: mine, title: "Mine", commentCount: 1 }]);
    expect(body.articles).toHaveLength(1);
  });

  test("404 for an unknown user", async () => {
    expect((await call("GET", "/users/nobody/articles")).status).toBe(404);
  });
});
