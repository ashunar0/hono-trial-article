/** The frame of every screen */
import type { Child } from "hono/jsx";

export function Layout({ title, children }: { title: string; children: Child }) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
          nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
          .muted { color: #666; font-size: .9em; }
          .error { color: #b00020; }
          textarea { width: 100%; min-height: 4rem; }
        `}</style>
      </head>
      <body>
        <nav>
          <a href="/articles">記事</a>
          <a href="/session">誰として使うか</a>
        </nav>
        <h1>{title}</h1>
        {children}
      </body>
    </html>
  );
}
