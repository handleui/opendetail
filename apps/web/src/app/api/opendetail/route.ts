import { buildOpenDetailIndex, toOpenDetailPublicError } from "opendetail";
import { createNextRouteHandler } from "opendetail-next";

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
        message: publicError.message,
        param: publicError.param,
        provider: publicError.provider,
        providerCode: publicError.providerCode,
        requestId: publicError.requestId,
        retryable: publicError.retryable,
        status: publicError.status,
      },
      { status: 500 }
    );
  }

  return handleOpenDetailRequest(request);
};
