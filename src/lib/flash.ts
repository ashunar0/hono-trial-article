/**
 * What a form leaves for the next screen, read once: the reason per field (errors) and what was typed (old).
 * The way Laravel (and so Inertia) and Void do it: a failed form goes back with these, the screen's GET shows them.
 * A stand-in: an unsigned cookie. The screens escape what they show
 */
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export type Flash = {
  errors: Record<string, string>;
  old: Record<string, string>;
};

const empty: Flash = { errors: {}, old: {} };

/** Back to the screen with the flash (303) */
export function back(c: Context, to: string, flash: Flash) {
  setCookie(c, "flash", encodeURIComponent(JSON.stringify(flash)), {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });

  return c.redirect(to, 303);
}

/** The flash left for this screen, gone once read */
export function takeFlash(c: Context): Flash {
  const raw = getCookie(c, "flash");
  if (!raw) return empty;
  deleteCookie(c, "flash", { path: "/" });

  try {
    return { ...empty, ...(JSON.parse(decodeURIComponent(raw)) as Partial<Flash>) };
  } catch {
    return empty;
  }
}
