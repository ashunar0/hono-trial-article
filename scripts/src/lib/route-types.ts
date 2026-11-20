/**
 * The schema entry of one route file's method, for the generated AppType (routes.gen.ts).
 * Each entry is built from its own handlers, so nothing piles up as routes are added
 */
import type { ExtractHandlerResponse, H, Input, ToSchema, TypedResponse } from "hono/types";

type Last<T> = T extends readonly [...unknown[], infer L] ? L : never;

/** The input the last handler sees: every validator before it, merged */
// The any are positions that do not matter here: env, path, response
type InputOf<T> = Last<T> extends H<any, any, infer I extends Input, any> ? I : {};

/** Every typed response a handler can give: the last one's, and a middleware's that stops early */
type OutputOf<T> = T extends readonly (infer Each)[]
  ? Extract<ExtractHandlerResponse<Each>, TypedResponse<any, any, any>>
  : never;

export type Endpoint<M extends string, P extends string, T> = ToSchema<
  M,
  P,
  InputOf<T>,
  OutputOf<T>
>;
