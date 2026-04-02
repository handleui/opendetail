export type OpenDetailClientStatus = "idle" | "pending" | "streaming" | "error";

export type OpenDetailClientErrorCode =
  | "invalid_request"
  | "invalid_runtime"
  | "method_not_allowed"
  | "missing_api_key"
  | "missing_index"
  | "model_incomplete"
  | "provider_auth"
  | "provider_invalid_request"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "request_failed";

const OPENDETAIL_CLIENT_ERROR_CODES = [
  "invalid_request",
  "invalid_runtime",
  "method_not_allowed",
  "missing_api_key",
  "missing_index",
  "model_incomplete",
  "provider_auth",
  "provider_invalid_request",
  "provider_rate_limited",
  "provider_unavailable",
  "request_failed",
] as const satisfies OpenDetailClientErrorCode[];

export interface OpenDetailTransportOptions {
  credentials?: RequestCredentials;
  endpoint?: string;
  fetch?: typeof fetch;
  headers?: HeadersInit | (() => HeadersInit);
}

export type OpenDetailClientOptions = OpenDetailTransportOptions;

export interface OpenDetailClientRequest {
  question: string;
}

export interface OpenDetailClientSource {
  headings: string[];
  id: string;
  title: string;
  url: string;
}

export interface OpenDetailClientImage {
  alt: string | null;
  sourceIds: string[];
  title: string | null;
  url: string;
}

export interface OpenDetailClientMetaEvent {
  model: string;
  type: "meta";
}

export interface OpenDetailClientSourcesEvent {
  sources: OpenDetailClientSource[];
  type: "sources";
}

export interface OpenDetailClientImagesEvent {
  images: OpenDetailClientImage[];
  type: "images";
}

export interface OpenDetailClientDeltaEvent {
  text: string;
  type: "delta";
}

export interface OpenDetailClientDoneEvent {
  text: string;
  type: "done";
}

export interface OpenDetailClientErrorEvent {
  code: OpenDetailClientErrorCode;
  message: string;
  param: string | null;
  provider: "openai" | null;
  providerCode: string | null;
  requestId: string | null;
  retryable: boolean;
  status: number | null;
  type: "error";
}

export type OpenDetailClientStreamEvent =
  | OpenDetailClientMetaEvent
  | OpenDetailClientSourcesEvent
  | OpenDetailClientImagesEvent
  | OpenDetailClientDeltaEvent
  | OpenDetailClientDoneEvent
  | OpenDetailClientErrorEvent;

export interface OpenDetailClientHandlers {
  onEvent?: (event: OpenDetailClientStreamEvent) => void;
  onStatusChange?: (status: OpenDetailClientStatus) => void;
}

export interface OpenDetailClient {
  endpoint: string;
  implemented: true;
  readonly status: OpenDetailClientStatus;
  stop: () => void;
  submit: (
    input: OpenDetailClientRequest,
    handlers?: OpenDetailClientHandlers
  ) => Promise<void>;
}

const DEFAULT_ENDPOINT = "/api/opendetail";
const FALLBACK_ERROR_MESSAGE = "OpenDetail request failed.";

interface OpenDetailClientPublicError {
  code: OpenDetailClientErrorCode;
  message: string;
  param: string | null;
  provider: "openai" | null;
  providerCode: string | null;
  requestId: string | null;
  retryable: boolean;
  status: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const resolveRequestHeaders = (
  headers: OpenDetailTransportOptions["headers"]
): Headers => {
  const resolvedHeaders =
    typeof headers === "function" ? headers() : (headers ?? undefined);
  const requestHeaders = new Headers(resolvedHeaders);

  requestHeaders.set("accept", "application/x-ndjson, application/json");
  requestHeaders.set("content-type", "application/json");
  return requestHeaders;
};

class OpenDetailClientRequestError extends Error {
  readonly code: OpenDetailClientErrorCode;
  readonly param: string | null;
  readonly provider: "openai" | null;
  readonly providerCode: string | null;
  readonly requestId: string | null;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor({
    code,
    message,
    param,
    provider,
    providerCode,
    requestId,
    retryable,
    status,
  }: OpenDetailClientPublicError) {
    super(message);
    this.code = code;
    this.name = "OpenDetailClientRequestError";
    this.param = param;
    this.provider = provider;
    this.providerCode = providerCode;
    this.requestId = requestId;
    this.retryable = retryable;
    this.status = status;
  }
}

const createFallbackPublicError = (): OpenDetailClientPublicError => ({
  code: "request_failed",
  message: FALLBACK_ERROR_MESSAGE,
  param: null,
  provider: null,
  providerCode: null,
  requestId: null,
  retryable: false,
  status: null,
});

const isOpenDetailClientErrorCode = (
  value: unknown
): value is OpenDetailClientErrorCode =>
  typeof value === "string" &&
  OPENDETAIL_CLIENT_ERROR_CODES.includes(value as OpenDetailClientErrorCode);

const getNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const getNullableNumber = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

const getNullableProvider = (value: unknown): "openai" | null =>
  value === "openai" ? "openai" : null;

const resolvePublicErrorFields = ({
  param,
  provider,
  providerCode,
  requestId,
  status,
}: {
  param?: unknown;
  provider?: unknown;
  providerCode?: unknown;
  requestId?: unknown;
  status?: unknown;
}) => ({
  param: getNullableString(param),
  provider: getNullableProvider(provider),
  providerCode: getNullableString(providerCode),
  requestId: getNullableString(requestId),
  status: getNullableNumber(status),
});

const createError = (
  publicError: OpenDetailClientPublicError
): OpenDetailClientRequestError =>
  new OpenDetailClientRequestError(publicError);

const isSource = (value: unknown): value is OpenDetailClientSource =>
  isRecord(value) &&
  isStringArray(value.headings) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.url === "string";

const isImage = (value: unknown): value is OpenDetailClientImage =>
  isRecord(value) &&
  isNullableString(value.alt) &&
  isStringArray(value.sourceIds) &&
  isNullableString(value.title) &&
  typeof value.url === "string";

const isMetaEvent = (value: unknown): value is OpenDetailClientMetaEvent =>
  isRecord(value) && value.type === "meta" && typeof value.model === "string";

const isSourcesEvent = (
  value: unknown
): value is OpenDetailClientSourcesEvent =>
  isRecord(value) &&
  value.type === "sources" &&
  Array.isArray(value.sources) &&
  value.sources.every((source) => isSource(source));

const isImagesEvent = (value: unknown): value is OpenDetailClientImagesEvent =>
  isRecord(value) &&
  value.type === "images" &&
  Array.isArray(value.images) &&
  value.images.every((image) => isImage(image));

const isDeltaEvent = (value: unknown): value is OpenDetailClientDeltaEvent =>
  isRecord(value) && value.type === "delta" && typeof value.text === "string";

const isDoneEvent = (value: unknown): value is OpenDetailClientDoneEvent =>
  isRecord(value) && value.type === "done" && typeof value.text === "string";

const isStructuredStreamEvent = (
  value: unknown
): value is Exclude<OpenDetailClientStreamEvent, OpenDetailClientErrorEvent> =>
  isMetaEvent(value) ||
  isSourcesEvent(value) ||
  isImagesEvent(value) ||
  isDeltaEvent(value) ||
  isDoneEvent(value);

const resolvePublicError = (
  value: unknown
): OpenDetailClientPublicError | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const { code, error, message, retryable } = value as {
    code?: unknown;
    error?: unknown;
    message?: unknown;
    param?: unknown;
    provider?: unknown;
    providerCode?: unknown;
    requestId?: unknown;
    retryable?: unknown;
    status?: unknown;
  };
  let resolvedMessage: string | null = null;

  if (typeof message === "string") {
    resolvedMessage = message;
  } else if (typeof error === "string") {
    resolvedMessage = error;
  }

  if (resolvedMessage === null || typeof retryable !== "boolean") {
    return null;
  }

  const resolvedFields = resolvePublicErrorFields(
    value as {
      param?: unknown;
      provider?: unknown;
      providerCode?: unknown;
      requestId?: unknown;
      status?: unknown;
    }
  );

  if (!isOpenDetailClientErrorCode(code)) {
    return {
      code: "request_failed",
      message: resolvedMessage,
      ...resolvedFields,
      retryable: false,
    };
  }

  return {
    code,
    message: resolvedMessage,
    ...resolvedFields,
    retryable,
  };
};

const resolveResponseErrorMessage = async (
  response: Response
): Promise<OpenDetailClientPublicError> => {
  try {
    const payload: unknown = await response.json();
    const publicError = resolvePublicError(payload);

    if (publicError) {
      return publicError;
    }
  } catch {
    // Ignore invalid JSON error bodies and fall back to the default message.
  }

  return createFallbackPublicError();
};

const setClientStatus = ({
  nextStatus,
  onStatusChange,
  setStatus,
}: {
  nextStatus: OpenDetailClientStatus;
  onStatusChange?: (status: OpenDetailClientStatus) => void;
  setStatus: (status: OpenDetailClientStatus) => void;
}) => {
  setStatus(nextStatus);
  onStatusChange?.(nextStatus);
};

const parseStreamEvent = (line: string): OpenDetailClientStreamEvent | null => {
  const trimmedLine = line.trim();

  if (trimmedLine.length === 0) {
    return null;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(trimmedLine);
  } catch {
    throw createError(createFallbackPublicError());
  }

  if (!isRecord(parsedValue) || typeof parsedValue.type !== "string") {
    return null;
  }

  if (parsedValue.type === "error") {
    const publicError = resolvePublicError(parsedValue);

    if (!publicError) {
      return {
        ...createFallbackPublicError(),
        type: "error",
      };
    }

    return {
      ...publicError,
      type: "error",
    };
  }

  if (!isStructuredStreamEvent(parsedValue)) {
    throw createError(createFallbackPublicError());
  }

  return parsedValue;
};

const handleStreamEvent = ({
  event,
  handlers,
  setStatus,
}: {
  event: OpenDetailClientStreamEvent;
  handlers?: OpenDetailClientHandlers;
  setStatus: (status: OpenDetailClientStatus) => void;
}): boolean => {
  handlers?.onEvent?.(event);

  if (event.type === "delta") {
    setClientStatus({
      nextStatus: "streaming",
      onStatusChange: handlers?.onStatusChange,
      setStatus,
    });
    return false;
  }

  if (event.type === "error") {
    setClientStatus({
      nextStatus: "error",
      onStatusChange: handlers?.onStatusChange,
      setStatus,
    });
    throw createError({
      code: event.code,
      message: event.message,
      param: event.param,
      provider: event.provider,
      providerCode: event.providerCode,
      requestId: event.requestId,
      retryable: event.retryable,
      status: event.status,
    });
  }

  return event.type === "done";
};

const readResponseStream = async ({
  handlers,
  response,
  setStatus,
}: {
  handlers?: OpenDetailClientHandlers;
  response: Response;
  setStatus: (status: OpenDetailClientStatus) => void;
}) => {
  if (!response.body) {
    throw createError(createFallbackPublicError());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasTerminalEvent = false;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseStreamEvent(line);

      if (!event) {
        continue;
      }

      hasTerminalEvent =
        handleStreamEvent({
          event,
          handlers,
          setStatus,
        }) || hasTerminalEvent;
    }
  }

  const trailingEvent = parseStreamEvent(buffer);

  if (trailingEvent) {
    hasTerminalEvent =
      handleStreamEvent({
        event: trailingEvent,
        handlers,
        setStatus,
      }) || hasTerminalEvent;
  }

  if (!hasTerminalEvent) {
    throw createError(createFallbackPublicError());
  }
};

export const createOpenDetailClient = (
  options: OpenDetailClientOptions = {}
): OpenDetailClient => {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const fetchImplementation = options.fetch ?? fetch;
  let status: OpenDetailClientStatus = "idle";
  let abortController: AbortController | null = null;

  const setStatus = (nextStatus: OpenDetailClientStatus) => {
    status = nextStatus;
  };

  const isActiveRequest = (requestAbortController: AbortController): boolean =>
    abortController === requestAbortController;

  const stop = () => {
    abortController?.abort();
    abortController = null;
    status = "idle";
  };

  return {
    endpoint,
    implemented: true,
    get status() {
      return status;
    },
    stop,
    submit: async (input, handlers) => {
      stop();

      const nextAbortController = new AbortController();
      abortController = nextAbortController;

      setClientStatus({
        nextStatus: "pending",
        onStatusChange: handlers?.onStatusChange,
        setStatus,
      });

      try {
        const response = await fetchImplementation(endpoint, {
          body: JSON.stringify(input),
          credentials: options.credentials,
          headers: resolveRequestHeaders(options.headers),
          method: "POST",
          signal: nextAbortController.signal,
        });

        if (!response.ok) {
          throw createError(await resolveResponseErrorMessage(response));
        }

        await readResponseStream({
          handlers,
          response,
          setStatus,
        });

        if (isActiveRequest(nextAbortController)) {
          setClientStatus({
            nextStatus: "idle",
            onStatusChange: handlers?.onStatusChange,
            setStatus,
          });
        }
      } catch (error) {
        if (nextAbortController.signal.aborted) {
          if (isActiveRequest(nextAbortController)) {
            setClientStatus({
              nextStatus: "idle",
              onStatusChange: handlers?.onStatusChange,
              setStatus,
            });
          }

          return;
        }

        if (isActiveRequest(nextAbortController)) {
          setClientStatus({
            nextStatus: "error",
            onStatusChange: handlers?.onStatusChange,
            setStatus,
          });
        }

        throw error;
      } finally {
        if (abortController === nextAbortController) {
          abortController = null;
        }
      }
    },
  };
};
