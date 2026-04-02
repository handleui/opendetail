export type OpenDetailClientStatus = "idle" | "pending" | "streaming" | "error";

export type OpenDetailClientErrorCode =
  | "invalid_request"
  | "invalid_runtime"
  | "method_not_allowed"
  | "missing_api_key"
  | "missing_index"
  | "model_incomplete"
  | "request_failed";

const OPENDETAIL_CLIENT_ERROR_CODES = [
  "invalid_request",
  "invalid_runtime",
  "method_not_allowed",
  "missing_api_key",
  "missing_index",
  "model_incomplete",
  "request_failed",
] as const satisfies OpenDetailClientErrorCode[];

export interface OpenDetailClientOptions {
  endpoint?: string;
  fetch?: typeof fetch;
}

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
  retryable: boolean;
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
  retryable: boolean;
}

class OpenDetailClientRequestError extends Error {
  readonly code: OpenDetailClientErrorCode;
  readonly retryable: boolean;

  constructor({ code, message, retryable }: OpenDetailClientPublicError) {
    super(message);
    this.code = code;
    this.name = "OpenDetailClientRequestError";
    this.retryable = retryable;
  }
}

const createFallbackPublicError = (): OpenDetailClientPublicError => ({
  code: "request_failed",
  message: FALLBACK_ERROR_MESSAGE,
  retryable: false,
});

const isOpenDetailClientErrorCode = (
  value: unknown
): value is OpenDetailClientErrorCode =>
  typeof value === "string" &&
  OPENDETAIL_CLIENT_ERROR_CODES.includes(value as OpenDetailClientErrorCode);

const createError = (
  publicError: OpenDetailClientPublicError
): OpenDetailClientRequestError =>
  new OpenDetailClientRequestError(publicError);

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
    retryable?: unknown;
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

  if (!isOpenDetailClientErrorCode(code)) {
    return {
      code: "request_failed",
      message: resolvedMessage,
      retryable: false,
    };
  }

  return {
    code,
    message: resolvedMessage,
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

  if (
    !parsedValue ||
    typeof parsedValue !== "object" ||
    !("type" in parsedValue) ||
    typeof parsedValue.type !== "string"
  ) {
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

  return parsedValue as OpenDetailClientStreamEvent;
};

const handleStreamEvent = ({
  event,
  handlers,
  setStatus,
}: {
  event: OpenDetailClientStreamEvent;
  handlers?: OpenDetailClientHandlers;
  setStatus: (status: OpenDetailClientStatus) => void;
}) => {
  handlers?.onEvent?.(event);

  if (event.type === "delta") {
    setClientStatus({
      nextStatus: "streaming",
      onStatusChange: handlers?.onStatusChange,
      setStatus,
    });
    return;
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
      retryable: event.retryable,
    });
  }
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

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
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

      handleStreamEvent({
        event,
        handlers,
        setStatus,
      });
    }
  }

  const trailingEvent = parseStreamEvent(buffer);

  if (trailingEvent) {
    handleStreamEvent({
      event: trailingEvent,
      handlers,
      setStatus,
    });
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
          headers: {
            "content-type": "application/json",
          },
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

        setClientStatus({
          nextStatus: "idle",
          onStatusChange: handlers?.onStatusChange,
          setStatus,
        });
      } catch (error) {
        if (nextAbortController.signal.aborted) {
          setClientStatus({
            nextStatus: "idle",
            onStatusChange: handlers?.onStatusChange,
            setStatus,
          });
          return;
        }

        if (status !== "error") {
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
