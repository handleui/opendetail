import { createNextRouteHandler } from "opendetail-next";

export const runtime = "nodejs";

// Use the app root for resolving `.opendetail/index.json` and `opendetail.toml`.
// `import.meta.url` points at the compiled route under `.next/server`, so we
// cannot derive the repo root from the route file path. `process.cwd()` is the
// Next.js app root in dev and typical Vercel installs when the project root is
// `apps/web`. For monorepo builds where the server cwd is the repository root,
// set `OPENDETAIL_CWD` (for example `apps/web`).
const opendetailCwd = process.env.OPENDETAIL_CWD?.trim() || process.cwd();

export const POST = createNextRouteHandler({
  assistantInstructions: " ",
  cwd: opendetailCwd,
});
