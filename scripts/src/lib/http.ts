/** How failures leave as JSON */
import type { Context } from "hono";
import { NotFound } from "./failures";

/** A domain's failure: NOT_FOUND is 404, the rest are 422 */
export const failed = (c: Context, code: string) =>
  c.json({ error: code }, code === NotFound.code ? 404 : 422);

/** The input names something that is not there (an author, …): the request is wrong, not the URL */
export const unknownIn = (c: Context, field: string) =>
  c.json({ error: NotFound.code, field }, 422);
