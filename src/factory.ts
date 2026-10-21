/** What every route file builds its handlers with. deps comes from the middleware in app.ts */
import { createFactory } from "hono/factory";
import type { Deps } from "./deps";

export type AppEnv = { Variables: { deps: Deps } };

export const factory = createFactory<AppEnv>();
