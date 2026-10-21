/** /articles */
import { ArticlesScreen } from "../../components/screens/articles";
import { factory } from "../../factory";

export const GET = factory.createHandlers(async (c) =>
  c.html(<ArticlesScreen articles={await c.var.deps.articlesQueries.list()} />),
);
