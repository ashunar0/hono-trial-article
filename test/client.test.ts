/** The generated AppType gives hc its types: inputs from the validators, outputs per status */
import { hc, type InferRequestType } from "hono/client";
import { expect, expectTypeOf, test } from "vitest";
import type { AppType } from "../src/routes.gen";
import { setup } from "./app";

test("a typed client over the generated AppType", async () => {
  const { app } = await setup();
  const client = hc<AppType>("http://localhost", { fetch: app.request });

  const user = await (await client.users.$post({ json: { name: "Alice" } })).json();
  const headers = { "x-user-id": user.user.id };

  const res = await client.articles.$post({ json: { title: "Hello", body: "..." } }, { headers });
  if (res.status !== 201) throw new Error(`expected 201, got ${res.status}`);
  const { article } = await res.json();

  const published = await client.articles[":id"].publication.$post({ param: { id: article.id } });
  expect(published.status).toBe(201);

  const shown = await client.articles[":id"].$get({ param: { id: article.id } });
  if (shown.status !== 200) throw new Error(`expected 200, got ${shown.status}`);
  const body = await shown.json();

  expectTypeOf(body.article.author).toEqualTypeOf<{ id: string; name: string }>();
  expectTypeOf(body.article.commentCount).toEqualTypeOf<number>();
  expect(body.article).toMatchObject({ title: "Hello", author: { name: "Alice" }, commentCount: 0 });

  // Inputs come from every validator: the path's param and the json body
  const commentOn = client.articles[":id"].comments.$post;
  expectTypeOf<InferRequestType<typeof commentOn>>().toEqualTypeOf<
    { param: { id: string } } & { json: { body: string } }
  >();
  const commented = await commentOn({ param: { id: article.id }, json: { body: "Nice" } }, { headers });
  expect(commented.status).toBe(201);

  const again = await client.articles[":id"].publication.$post({ param: { id: article.id } });
  if (again.status === 422) expectTypeOf((await again.json()).error).toEqualTypeOf<string>();
  expect(again.status).toBe(422);
});
