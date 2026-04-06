import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";

const docsPageOptions = {
  schema: pageSchema,
  postprocess: {
    includeProcessedMarkdown: true,
  },
} as const;

const metaOptions = {
  schema: metaSchema,
} as const;

/** Main documentation — `/docs`. */
export const docs = defineDocs({
  dir: "content/docs",
  docs: docsPageOptions,
  meta: metaOptions,
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
