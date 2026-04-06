import { NDJSON_CONTENT_TYPE } from "opendetail/constants";
import {
  createOpenDetailPublicError,
  toOpenDetailPublicError,
} from "opendetail/errors";
import { createOpenDetail } from "opendetail/runtime";
import type {
  CreateOpenDetailOptions,
  OpenDetailAssistant,
  OpenDetailPublicError,
  OpenDetailRuntimeInput,
} from "opendetail/types";
import {
  INVALID_REQUEST_BODY_MESSAGE,
  OpenDetailAnswerInputSchema,
} from "opendetail/validation";
import { renderNextSourceLink as renderNextSourceLinkImplementation } from "./link";

const NO_STORE_HEADER = "no-store";
const NO_SNIFF_HEADER = "nosniff";
const POST_METHOD = "POST";

const createResponseHeaders = (headers?: HeadersInit): Headers => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("cache-control", NO_STORE_HEADER);
  responseHeaders.set("x-content-type-options", NO_SNIFF_HEADER);
  return responseHeaders;
};

const jsonError = (
  publicError: OpenDetailPublicError,
  status: number,
  headers?: HeadersInit
): Response =>
  Response.json(
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
    { headers: createResponseHeaders(headers), status }
  );

const logDevelopmentRouteError = (phase: string, error: unknown): void => {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[opendetail] ${phase}`, error);
  }
};

const getInitializationErrorResponse = (error: unknown): Response => {
  logDevelopmentRouteError("createOpenDetail failed", error);

  return jsonError(toOpenDetailPublicError(error), 500);
};

const isProductionEnvironment = (): boolean =>
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

const shouldCacheInitializationError = (): boolean => isProductionEnvironment();

const getInvalidRequestResponse = (): Response =>
  jsonError(
    createOpenDetailPublicError("invalid_request", {
      message: INVALID_REQUEST_BODY_MESSAGE,
    }),
    400
  );

const createOpenDetailLoader = (
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
        .then(() => createOpenDetail(options))
        .then((assistant) => {
          cachedAssistant = assistant;
          return assistant;
        })
        .catch((error: unknown) => {
          if (shouldCacheInitializationError()) {
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

export type CreateNextRouteHandlerOptions = CreateOpenDetailOptions;

export const createNextRouteHandler = (
  options: CreateNextRouteHandlerOptions = {}
): ((request: Request) => Promise<Response>) => {
  const loadOpenDetail = createOpenDetailLoader(options);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return jsonError(createOpenDetailPublicError("method_not_allowed"), 405, {
        allow: POST_METHOD,
      });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return getInvalidRequestResponse();
    }

    const parsedBody = OpenDetailAnswerInputSchema.safeParse(body);

    if (!parsedBody.success) {
      return getInvalidRequestResponse();
    }

    let assistant: OpenDetailAssistant;

    try {
      assistant = await loadOpenDetail();
    } catch (error) {
      return getInitializationErrorResponse(error);
    }

    try {
      const streamInput: OpenDetailRuntimeInput = parsedBody.data;

      const result = await assistant.stream(streamInput);

      return new Response(result.stream, {
        headers: createResponseHeaders({
          "content-type": NDJSON_CONTENT_TYPE,
        }),
        status: 200,
      });
    } catch (error) {
      logDevelopmentRouteError("assistant.stream failed", error);

      return jsonError(toOpenDetailPublicError(error), 500);
    }
  };
};

export const createNextRoute = (
  options: CreateNextRouteHandlerOptions = {}
): {
  POST: (request: Request) => Promise<Response>;
  runtime: "nodejs";
} => ({
  POST: createNextRouteHandler(options),
  runtime: "nodejs",
});

export const renderNextSourceLink = renderNextSourceLinkImplementation;
export type {
  RenderAssistantSourceLink,
  RenderAssistantSourceLinkProps,
} from "opendetail-react";
