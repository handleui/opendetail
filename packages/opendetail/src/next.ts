import { NDJSON_CONTENT_TYPE } from "./constants";
import { createOpenDetailPublicError, toOpenDetailPublicError } from "./errors";
import type { CreateOpenDetailOptions, OpenDetailAssistant } from "./types";
import {
  INVALID_REQUEST_BODY_MESSAGE,
  OpenDetailAnswerInputSchema,
} from "./validation";

const jsonError = (
  publicError: {
    code: string;
    message: string;
    retryable: boolean;
  },
  status: number,
  headers?: HeadersInit
): Response =>
  Response.json(
    {
      code: publicError.code,
      error: publicError.message,
      retryable: publicError.retryable,
    },
    { headers, status }
  );

const getInitializationErrorResponse = (error: unknown): Response =>
  jsonError(toOpenDetailPublicError(error), 500);

const shouldCacheInitializationError = (): boolean => true;

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
      return jsonError(createOpenDetailPublicError("method_not_allowed"), 405, {
        allow: "POST",
      });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        createOpenDetailPublicError("invalid_request", {
          message: INVALID_REQUEST_BODY_MESSAGE,
        }),
        400
      );
    }

    const parsedBody = OpenDetailAnswerInputSchema.safeParse(body);

    if (!parsedBody.success) {
      return jsonError(
        createOpenDetailPublicError("invalid_request", {
          message: INVALID_REQUEST_BODY_MESSAGE,
        }),
        400
      );
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
    } catch (error) {
      return jsonError(toOpenDetailPublicError(error), 500);
    }
  };
};

export type { CreateOpenDetailOptions as CreateNextRouteHandlerOptions } from "./types";
