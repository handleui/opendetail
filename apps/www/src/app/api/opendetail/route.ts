import { buildOpenDetailIndex } from "../../../../../../packages/opendetail/dist/index.js";
import { createNextRouteHandler } from "../../../../../../packages/opendetail/dist/next.js";

export const runtime = "nodejs";

let productionBuildPromise: Promise<void> | null = null;

const ensureIndex = async () => {
  const cwd = process.cwd();

  if (process.env.NODE_ENV !== "production") {
    await buildOpenDetailIndex({ cwd });
    return;
  }

  if (!productionBuildPromise) {
    productionBuildPromise = buildOpenDetailIndex({ cwd }).then(
      () => undefined
    );
  }

  await productionBuildPromise;
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    await ensureIndex();
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message.length > 0
            ? error.message
            : "OpenDetail index build failed.",
      },
      { status: 500 }
    );
  }

  return createNextRouteHandler({ cwd: process.cwd() })(request);
};
