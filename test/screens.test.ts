/** The screens: HTML from the same queries as the API, forms that redirect back (303) */
import { beforeEach, describe, expect, test } from "vitest";
import { setup } from "./app";

let app: Awaited<ReturnType<typeof setup>>["app"];
let call: Awaited<ReturnType<typeof setup>>["call"];
let aliceId: string;
let articleId: string;

beforeEach(async () => {
  ({ app, call } = await setup());
  aliceId = (await call("POST", "/api/users", { body: { name: "Alice" } })).body.user.id;
  articleId = (
    await call("POST", "/api/articles", { body: { title: "Hello", body: "World" }, as: aliceId })
  ).body.article.id;
  await call("POST", `/api/articles/${articleId}/publication`);
});

/** A form post from a browser, signed in as someone or not */
const post = (path: string, form: Record<string, string>, as?: string) =>
  app.request(path, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(as && { cookie: `user=${as}` }),
    },
    body: new URLSearchParams(form).toString(),
  });

describe("/articles", () => {
  test("lists the published ones with author and comment count", async () => {
    const html = await (await app.request("/articles")).text();

    expect(html).toContain(`<a href="/articles/${articleId}">Hello</a>`);
    expect(html).toContain("Alice・コメント 0");
  });
});

describe("/articles/:id", () => {
  test("404 for a draft", async () => {
    await call("DELETE", `/api/articles/${articleId}/publication`);

    expect((await app.request(`/articles/${articleId}`)).status).toBe(404);
  });

  test("a comment goes back to the article, and shows there", async () => {
    const res = await post(`/articles/${articleId}/comments`, { body: "Nice" }, aliceId);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/articles/${articleId}`);
    expect(await (await app.request(`/articles/${articleId}`)).text()).toContain("Nice");
  });

  test("an empty comment shows the article again with the reason and what was typed", async () => {
    const res = await post(`/articles/${articleId}/comments`, { body: " " }, aliceId);
    const html = await res.text();

    expect(res.status).toBe(422);
    expect(html).toContain("コメントは 1〜1000 文字で書いてください。");
    expect(html).toContain("<h1>Hello</h1>");
  });

  test("commenting needs someone: to /session", async () => {
    const res = await post(`/articles/${articleId}/comments`, { body: "Nice" });

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/session");
  });
});

describe("/session", () => {
  test("choosing a user sets the cookie the screens read", async () => {
    const res = await post("/session", { userId: aliceId });

    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toContain(`user=${aliceId}`);
  });
});
