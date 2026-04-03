import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextRouteHandler } from "opendetail-next";

export const runtime = "nodejs";

const routeDirectory = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(routeDirectory, "../../../../");
const indexPath = path.resolve(cwd, ".opendetail/index.json");

// This app does not ship a project instructions file, so skip the runtime
// fallback file lookup and point directly at the generated index artifact.
export const POST = createNextRouteHandler({
  assistantInstructions: " ",
  cwd,
  indexPath,
});
