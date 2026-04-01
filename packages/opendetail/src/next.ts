import { NDJSON_CONTENT_TYPE, OPENDETAIL_INDEX_FILE } from "./constants";
import { OpenDetailIndexNotFoundError } from "./errors";
import type { CreateOpenDetailOptions, OpenDetailAssistant } from "./types";
import {
  INVALID_REQUEST_BODY_MESSAGE,
  OpenDetailAnswerInputSchema,
} from "./validation";

const NODE_RUNTIME_REQUIRED_MESSAGE =
  'OpenDetail requires the Node.js runtime. In Next.js route handlers, add `export const runtime = "nodejs"`.';
const PUBLIC_ROUTE_ERROR_MESSAGE = "OpenDetail request failed.";

const isProductionEnvironment = (): boolean =>
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

const jsonError = (
  message: string,
  status: number,
  headers?: HeadersInit
): Response => Response.json({ error: message }, { headers, status });

const getInitializationErrorResponse = (error: unknown): Response => {
  if (
    error instanceof OpenDetailIndexNotFoundError &&
    isProductionEnvironment()
  ) {
    return jsonError(
      `OpenDetail index is missing. Run \`npx opendetail build\` before starting the production server. The default location is \`${OPENDETAIL_INDEX_FILE}\`.`,
      500
    );
  }

  if (
    error instanceof Error &&
    error.message === NODE_RUNTIME_REQUIRED_MESSAGE
  ) {
    return jsonError(error.message, 500);
  }

  return jsonError(PUBLIC_ROUTE_ERROR_MESSAGE, 500);
};

const shouldCacheInitializationError = (error: unknown): boolean =>
  isProductionEnvironment() || !(error instanceof OpenDetailIndexNotFoundError);

const createAssistantLoader = (
  options: CreateOpenDetailOptions
): (() => Promise<OpenDetailAssistant>) => {
  let cachedAssistant: OpenDetailAssistant | null = null;
  let cachedError: unknown = null;
  let pendingAssistant: Promise<OpenDetailAssistant> | null = null;

  return (): Promise<OpenDetailAssistant> => {
    if (cachedAssistant) {
      return Promise.resolve(cachedAssistant);
    }

    if (cachedError) {
      return Promise.reject(cachedError);
    }

    if (!pendingAssistant) {
      pendingAssistant = Promise.resolve()
        .then(async () => {
          const runtimeModule = await import("./runtime");

          return runtimeModule.createOpenDetail(options);
        })
        .then((assistant) => {
          cachedAssistant = assistant;
          return assistant;
        })
        .catch((error: unknown) => {
          if (shouldCacheInitializationError(error)) {
            cachedError = error;
          }

          throw error;
        })
        .finally(() => {
          pendingAssistant = null;
        });
    }

    return pendingAssistant;
  };
};

export const createNextRouteHandler = (
  options: CreateOpenDetailOptions = {}
): ((request: Request) => Promise<Response>) => {
  const loadAssistant = createAssistantLoader(options);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return jsonError(
        "Method not allowed. Use POST with a JSON body shaped like { question: string }.",
        405,
        {
          allow: "POST",
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(INVALID_REQUEST_BODY_MESSAGE, 400);
    }

    const parsedBody = OpenDetailAnswerInputSchema.safeParse(body);

    if (!parsedBody.success) {
      return jsonError(INVALID_REQUEST_BODY_MESSAGE, 400);
    }

    let assistant: OpenDetailAssistant;

    try {
      assistant = await loadAssistant();
    } catch (error) {
      return getInitializationErrorResponse(error);
    }

    try {
      const result = await assistant.stream(parsedBody.data);

      return new Response(result.stream, {
        headers: {
          "cache-control": "no-store",
          "content-type": NDJSON_CONTENT_TYPE,
        },
        status: 200,
      });
    } catch {
      return jsonError(PUBLIC_ROUTE_ERROR_MESSAGE, 500);
    }
  };
};

export type { CreateOpenDetailOptions as CreateNextRouteHandlerOptions } from "./types";
