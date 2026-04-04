import { createNextRouteHandler } from "opendetail-next";

export const runtime = "nodejs";

// Use `process.cwd()` for the app root. `import.meta.url` refers to the
// compiled route under `.next/server` in production, so relative paths to the
// repo root break and `.opendetail/index.json` is not found even when the
// build step (`bunx opendetail build` in `apps/web` `package.json` `build`)
// produced it.
export const POST = createNextRouteHandler({
  assistantInstructions: " ",
  cwd: process.cwd(),
});
