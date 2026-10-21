/**
 * Generates the same API three ways, to compare how heavy their types are for tsc:
 * chain (one Hono chain), routed (a chain per resource, joined with .route), flat (createHandlers per file,
 * an AppType of Endpoint entries side by side). Each resource has 5 endpoints.
 * Usage: tsx bench/make.ts <resources>...   → bench/out/<way>-<resources>/
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "out");
const article = join(import.meta.dirname, "..");

const write = (path: string, code: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, code);
};

const tsconfig = (dir: string) =>
  write(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: [],
        },
        include: ["**/*.ts"],
      },
      null,
      2,
    ),
  );

/** Every resource has its own schemas, as real ones do */
const schemas = (i: number) => `
export const params${i} = z.object({ id: z.string().min(1) });
export const input${i} = z.object({ title${i}: z.string(), count${i}: z.number(), done${i}: z.boolean() });
export type Row${i} = { id: string; title${i}: string; count${i}: number; done${i}: boolean; createdAt: string };
export const row${i} = (id: string): Row${i} => ({ id, title${i}: "", count${i}: 0, done${i}: false, createdAt: "" });
`;

const shared = (n: number) => `import { z } from "zod";
${Array.from({ length: n }, (_, i) => schemas(i)).join("")}`;

/** The 5 endpoints of resource i, as arguments to app.<method>(path, ...) */
const endpoints = (i: number) => [
  ["get", "/", `(c) => c.json({ items: [row${i}("a")] }, 200)`],
  [
    "post",
    "/",
    `sValidator("json", input${i}), (c) => c.json({ item: { ...row${i}("a"), ...c.req.valid("json") } }, 201)`,
  ],
  [
    "get",
    "/:id",
    `sValidator("param", params${i}), (c) => (c.req.valid("param").id === "x" ? c.json({ error: "NOT_FOUND" }, 404) : c.json({ item: row${i}(c.req.valid("param").id) }, 200))`,
  ],
  [
    "patch",
    "/:id",
    `sValidator("param", params${i}), sValidator("json", input${i}.partial()), (c) => (c.req.valid("param").id === "x" ? c.json({ error: "NOT_FOUND" }, 404) : c.json({ item: { ...row${i}(c.req.valid("param").id), ...c.req.valid("json") } }, 200))`,
  ],
  [
    "delete",
    "/:id",
    `sValidator("param", params${i}), (c) => (c.req.valid("param").id === "x" ? c.json({ error: "NOT_FOUND" }, 404) : c.body(null, 204))`,
  ],
] as const;

const imports = `import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import * as s from "./shared";
`;

/** Calls the first and the last resource through hc, so the client types are resolved */
const client = (n: number) => `import { hc } from "hono/client";
import type { AppType } from "./app";

const client = hc<AppType>("http://localhost");

export async function use() {
  const list = await (await client.r0.$get()).json();
  const created = await client.r${n - 1}.$post({ json: { title${n - 1}: "x", count${n - 1}: 1, done${n - 1}: true } });
  const shown = await client.r${n - 1}[":id"].$get({ param: { id: "a" } });
  if (shown.status === 200) {
    const { item } = await shown.json();
    // The types must not collapse to any, or the numbers mean nothing
    const typed: (0 extends 1 & typeof item ? "any" : "typed") = "typed";
    void typed;
    return [list.items[0]?.id, item.title${n - 1}, created.status] as const;
  }
  return null;
}
`;

const withPrefix = (code: string) => code.replace(/\b(row|input|params)(\d+)\b/g, "s.$1$2");

function chain(n: number) {
  const dir = join(root, `chain-${n}`);
  write(join(dir, "shared.ts"), shared(n));
  const calls = Array.from({ length: n }, (_, i) =>
    endpoints(i).map(([m, p, body]) => `  .${m}("/r${i}${p === "/" ? "" : p}", ${withPrefix(body)})`),
  ).flat();
  write(join(dir, "app.ts"), `${imports}\nconst app = new Hono()\n${calls.join("\n")};\n\nexport type AppType = typeof app;\n`);
  write(join(dir, "client.ts"), client(n));
  tsconfig(dir);
}

function routed(n: number) {
  const dir = join(root, `routed-${n}`);
  write(join(dir, "shared.ts"), shared(n));
  for (let i = 0; i < n; i++) {
    const calls = endpoints(i).map(([m, p, body]) => `  .${m}("${p}", ${withPrefix(body)})`);
    write(join(dir, `r${i}.ts`), `${imports}\nexport const r${i} = new Hono()\n${calls.join("\n")};\n`);
  }
  const app = `import { Hono } from "hono";
${Array.from({ length: n }, (_, i) => `import { r${i} } from "./r${i}";`).join("\n")}

const app = new Hono()
${Array.from({ length: n }, (_, i) => `  .route("/r${i}", r${i})`).join("\n")};

export type AppType = typeof app;
`;
  write(join(dir, "app.ts"), app);
  write(join(dir, "client.ts"), client(n));
  tsconfig(dir);
}

function flat(n: number) {
  const dir = join(root, `flat-${n}`);
  write(join(dir, "shared.ts"), shared(n));
  write(
    join(dir, "route-types.ts"),
    readRouteTypes(),
  );
  const entries: string[] = [];
  const routeImports: string[] = [];
  for (let i = 0; i < n; i++) {
    for (const [file, path, eps] of [
      [`r${i}/index.ts`, `/r${i}`, endpoints(i).slice(0, 2)],
      [`r${i}/[id]/index.ts`, `/r${i}/:id`, endpoints(i).slice(2)],
    ] as const) {
      const depth = file.split("/").length - 1;
      const up = "../".repeat(depth + 1);
      const code = `import { createFactory } from "hono/factory";
import { sValidator } from "@hono/standard-validator";
import * as s from "${up}shared";

const factory = createFactory();
${eps.map(([m, , body]) => `export const ${m.toUpperCase()} = factory.createHandlers(${withPrefix(body)});`).join("\n")}
`;
      write(join(dir, "routes", file), code);
      const name = `route${routeImports.length}`;
      routeImports.push(`import type * as ${name} from "./routes/${file.replace(/\.ts$/, "")}";`);
      for (const [m] of eps) entries.push(`Endpoint<"${m}", "${path}", typeof ${name}.${m.toUpperCase()}>`);
    }
  }
  write(
    join(dir, "app.ts"),
    `import type { Hono } from "hono";
import type { Endpoint } from "./route-types";
${routeImports.join("\n")}

export type AppType = Hono<
  {},
  ${entries.join("\n  & ")}
>;
`,
  );
  write(join(dir, "client.ts"), client(n));
  tsconfig(dir);
}

import { readFileSync } from "node:fs";
const readRouteTypes = () => readFileSync(join(article, "src/lib/route-types.ts"), "utf8");

rmSync(root, { recursive: true, force: true });
for (const arg of process.argv.slice(2)) {
  const n = Number(arg);
  chain(n);
  routed(n);
  flat(n);
}
console.log(`bench/out: ${process.argv.slice(2).join(", ")} resources × chain, routed, flat`);
