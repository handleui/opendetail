import { buildOpenDetailIndex } from "../../../../../../packages/opendetail/src";
import { toOpenDetailPublicError } from "../../../../../../packages/opendetail/src/errors";
import { createNextRouteHandler } from "../../../../../../packages/opendetail/src/next";

export const runtime = "nodejs";

const cwd = process.cwd();
const handleOpenDetailRequest = createNextRouteHandler({ cwd });

let productionBuildPromise: Promise<void> | null = null;

const ensureIndex = async () => {
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
    const publicError = toOpenDetailPublicError(error);

    return Response.json(
      {
        code: publicError.code,
        error: publicError.message,
        retryable: publicError.retryable,
      },
      { status: 500 }
    );
  }

  return handleOpenDetailRequest(request);
};
