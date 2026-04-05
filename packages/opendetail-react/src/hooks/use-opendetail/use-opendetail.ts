"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createOpenDetailClient,
  type OpenDetailClientErrorCode,
  type OpenDetailClientErrorEvent,
  type OpenDetailClientImage,
  type OpenDetailClientRequest,
  type OpenDetailClientSource,
  type OpenDetailClientStatus,
  type OpenDetailClientStreamEvent,
  type OpenDetailTransportOptions,
} from "../../lib/opendetail-client/opendetail-client";

const DEFAULT_ERROR_MESSAGE = "OpenDetail request failed.";
const DEFAULT_PERSISTENCE_STORAGE = "local";
const INTERRUPTED_RESPONSE_MESSAGE =
  "Response interrupted after refresh. Ask again to continue.";
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
const THREAD_STORAGE_VERSION = 2;

export interface OpenDetailUserMessage {
  id: string;
  question: string;
  role: "user";
}

export interface OpenDetailAssistantMessage {
  durationLabel: string | null;
  error: string | null;
  errorCode: OpenDetailClientErrorCode | null;
  errorParam: string | null;
  errorProvider: "openai" | null;
  errorProviderCode: string | null;
  errorRequestId: string | null;
  errorRetryable: boolean | null;
  errorStatus: number | null;
  id: string;
  images: OpenDetailClientImage[];
  model: string | null;
  role: "assistant";
  sources: OpenDetailClientSource[];
  status: "complete" | "error" | "pending" | "streaming";
  text: string;
}

export type OpenDetailThreadMessage =
  | OpenDetailUserMessage
  | OpenDetailAssistantMessage;

export type OpenDetailPersistenceStorage = "local" | "session";

export interface OpenDetailPersistenceOptions {
  key: string;
  storage?: OpenDetailPersistenceStorage;
}

export interface UseOpenDetailOptions {
  endpoint?: string;
  persistence?: OpenDetailPersistenceOptions;
  /** When set, sent as `sitePaths` to scope retrieval to these URL path prefixes. */
  sitePaths?: string[];
  transport?: OpenDetailTransportOptions;
}

export interface UseOpenDetailState {
  clearThread: () => void;
  conversationTitle: string | null;
  error: string | null;
  errorCode: OpenDetailClientErrorCode | null;
  errorParam: string | null;
  errorProvider: "openai" | null;
  errorProviderCode: string | null;
  errorRequestId: string | null;
  errorRetryable: boolean | null;
  errorStatus: number | null;
  implemented: true;
  messages: OpenDetailThreadMessage[];
  question: string;
  setQuestion: (value: string) => void;
  status: OpenDetailClientStatus;
  stop: () => void;
  submit: (request?: OpenDetailClientRequest) => Promise<void>;
}

interface OpenDetailErrorState {
  error: string | null;
  errorCode: OpenDetailClientErrorCode | null;
  errorParam: string | null;
  errorProvider: "openai" | null;
  errorProviderCode: string | null;
  errorRequestId: string | null;
  errorRetryable: boolean | null;
  errorStatus: number | null;
}

interface OpenDetailPersistedState {
  conversationTitle: string | null;
  messages: OpenDetailThreadMessage[];
  question: string;
  version: number;
}

const EMPTY_ERROR_STATE: OpenDetailErrorState = {
  error: null,
  errorCode: null,
  errorParam: null,
  errorProvider: null,
  errorProviderCode: null,
  errorRequestId: null,
  errorRetryable: null,
  errorStatus: null,
};

const createMessageId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toDurationLabel = (startedAt: number): string => {
  const durationInSeconds = Math.max(
    1,
    Math.round((Date.now() - startedAt) / 1000)
  );

  return `${durationInSeconds} second${durationInSeconds === 1 ? "" : "s"}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || typeof value === "number";

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === "boolean";

const isNullableOpenAiProvider = (value: unknown): value is "openai" | null =>
  value === null || value === "openai";

const isSourceKind = (
  value: unknown
): value is "local" | "page" | "remote" | undefined =>
  value === undefined ||
  value === "local" ||
  value === "page" ||
  value === "remote";

const isOpenDetailClientErrorCode = (
  value: unknown
): value is OpenDetailClientErrorCode =>
  typeof value === "string" &&
  OPENDETAIL_CLIENT_ERROR_CODES.includes(value as OpenDetailClientErrorCode);

const isAssistantStatus = (
  value: unknown
): value is OpenDetailAssistantMessage["status"] =>
  value === "complete" ||
  value === "error" ||
  value === "pending" ||
  value === "streaming";

const isOpenDetailClientSource = (
  value: unknown
): value is OpenDetailClientSource =>
  isRecord(value) &&
  isStringArray(value.headings) &&
  typeof value.id === "string" &&
  isSourceKind(value.kind) &&
  typeof value.title === "string" &&
  typeof value.url === "string";

const isOpenDetailClientImage = (
  value: unknown
): value is OpenDetailClientImage =>
  isRecord(value) &&
  isNullableString(value.alt) &&
  isStringArray(value.sourceIds) &&
  isNullableString(value.title) &&
  typeof value.url === "string";

const isOpenDetailUserMessage = (
  value: unknown
): value is OpenDetailUserMessage =>
  isRecord(value) &&
  value.role === "user" &&
  typeof value.id === "string" &&
  typeof value.question === "string";

const isOpenDetailAssistantMessage = (
  value: unknown
): value is OpenDetailAssistantMessage =>
  isRecord(value) &&
  value.role === "assistant" &&
  isNullableString(value.durationLabel) &&
  isNullableString(value.error) &&
  isNullableString(value.errorCode) &&
  isNullableString(value.errorParam) &&
  isNullableOpenAiProvider(value.errorProvider) &&
  isNullableString(value.errorProviderCode) &&
  isNullableString(value.errorRequestId) &&
  isNullableBoolean(value.errorRetryable) &&
  isNullableNumber(value.errorStatus) &&
  typeof value.id === "string" &&
  Array.isArray(value.images) &&
  value.images.every((image) => isOpenDetailClientImage(image)) &&
  isNullableString(value.model) &&
  Array.isArray(value.sources) &&
  value.sources.every((source) => isOpenDetailClientSource(source)) &&
  isAssistantStatus(value.status) &&
  typeof value.text === "string";

const isOpenDetailThreadMessage = (
  value: unknown
): value is OpenDetailThreadMessage =>
  isOpenDetailUserMessage(value) || isOpenDetailAssistantMessage(value);

const normalizePersistedThreadMessage = (
  message: OpenDetailThreadMessage
): OpenDetailThreadMessage | null => {
  if (message.role === "user") {
    return message;
  }

  if (message.status === "complete" || message.status === "error") {
    return message;
  }

  if (message.text.trim().length === 0) {
    return null;
  }

  return {
    ...message,
    error: INTERRUPTED_RESPONSE_MESSAGE,
    errorCode: null,
    errorParam: null,
    errorProvider: null,
    errorProviderCode: null,
    errorRequestId: null,
    errorRetryable: false,
    errorStatus: null,
    status: "error",
    text: `${message.text}\n\n${INTERRUPTED_RESPONSE_MESSAGE}`,
  };
};

const isPersistedState = (value: unknown): value is OpenDetailPersistedState =>
  isRecord(value) &&
  (value.version === 1 || value.version === THREAD_STORAGE_VERSION) &&
  Array.isArray(value.messages) &&
  value.messages.every((message) => isOpenDetailThreadMessage(message)) &&
  typeof value.question === "string" &&
  (value.conversationTitle === undefined ||
    value.conversationTitle === null ||
    typeof value.conversationTitle === "string");

const resolveStorage = (
  storage: OpenDetailPersistenceStorage
): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return storage === "session" ? window.sessionStorage : window.localStorage;
};

const readPersistedState = ({
  key,
  storage,
}: OpenDetailPersistenceOptions): OpenDetailPersistedState | null => {
  const storageInstance = resolveStorage(
    storage ?? DEFAULT_PERSISTENCE_STORAGE
  );

  if (!storageInstance) {
    return null;
  }

  try {
    const rawValue = storageInstance.getItem(key);

    if (rawValue === null) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isPersistedState(parsedValue)) {
      storageInstance.removeItem(key);
      return null;
    }

    return {
      ...parsedValue,
      conversationTitle:
        typeof parsedValue.conversationTitle === "string"
          ? parsedValue.conversationTitle
          : null,
      messages: parsedValue.messages
        .map((message) => normalizePersistedThreadMessage(message))
        .filter((message) => message !== null),
    };
  } catch {
    try {
      storageInstance.removeItem(key);
    } catch {
      // Ignore invalid storage cleanup failures and fall back to in-memory state.
    }

    return null;
  }
};

const writePersistedState = ({
  conversationTitle,
  key,
  messages,
  question,
  storage,
}: OpenDetailPersistenceOptions & {
  conversationTitle: string | null;
  messages: OpenDetailThreadMessage[];
  question: string;
}) => {
  const storageInstance = resolveStorage(
    storage ?? DEFAULT_PERSISTENCE_STORAGE
  );

  if (!storageInstance) {
    return;
  }

  try {
    storageInstance.setItem(
      key,
      JSON.stringify({
        conversationTitle,
        messages,
        question,
        version: THREAD_STORAGE_VERSION,
      } satisfies OpenDetailPersistedState)
    );
  } catch {
    // Ignore storage write failures and keep the in-memory thread working.
  }
};

const clearPersistedState = ({
  key,
  storage,
}: OpenDetailPersistenceOptions) => {
  const storageInstance = resolveStorage(
    storage ?? DEFAULT_PERSISTENCE_STORAGE
  );

  if (!storageInstance) {
    return;
  }

  try {
    storageInstance.removeItem(key);
  } catch {
    // Ignore storage clear failures and keep the in-memory thread working.
  }
};

const updateAssistantMessage = (
  messages: OpenDetailThreadMessage[],
  assistantMessageId: string,
  updateMessage: (
    message: OpenDetailAssistantMessage
  ) => OpenDetailAssistantMessage
): OpenDetailThreadMessage[] =>
  messages.map((message) => {
    if (message.role !== "assistant" || message.id !== assistantMessageId) {
      return message;
    }

    return updateMessage(message);
  });

const removeAssistantMessage = (
  messages: OpenDetailThreadMessage[],
  assistantMessageId: string
): OpenDetailThreadMessage[] =>
  messages.filter(
    (message) =>
      message.role !== "assistant" || message.id !== assistantMessageId
  );

const applyStreamEvent = ({
  assistantMessageId,
  event,
  startedAt,
  setMessages,
}: {
  assistantMessageId: string;
  event: OpenDetailClientStreamEvent;
  setMessages: Dispatch<SetStateAction<OpenDetailThreadMessage[]>>;
  startedAt: number;
}) => {
  setMessages((messages) =>
    updateAssistantMessage(messages, assistantMessageId, (message) => {
      if (event.type === "title") {
        return message;
      }

      if (event.type === "meta") {
        return {
          ...message,
          model: event.model,
        };
      }

      if (event.type === "sources") {
        return {
          ...message,
          sources: event.sources,
        };
      }

      if (event.type === "images") {
        return {
          ...message,
          images: event.images,
        };
      }

      if (event.type === "delta") {
        return {
          ...message,
          status: "streaming",
          text: `${message.text}${event.text}`,
        };
      }

      if (event.type === "done") {
        return {
          ...message,
          durationLabel: toDurationLabel(startedAt),
          status: "complete",
          text: event.text,
        };
      }

      return {
        ...message,
        durationLabel: toDurationLabel(startedAt),
        error: event.message,
        errorCode: event.code,
        errorParam: event.param,
        errorProvider: event.provider,
        errorProviderCode: event.providerCode,
        errorRequestId: event.requestId,
        errorRetryable: event.retryable,
        errorStatus: event.status,
        images: [],
        sources: [],
        status: "error",
        text: event.message,
      };
    })
  );
};

const createPendingAssistantMessage = (
  assistantMessageId: string
): OpenDetailAssistantMessage => ({
  durationLabel: null,
  error: null,
  errorCode: null,
  errorParam: null,
  errorProvider: null,
  errorProviderCode: null,
  errorRequestId: null,
  errorRetryable: null,
  errorStatus: null,
  id: assistantMessageId,
  images: [],
  model: null,
  role: "assistant",
  sources: [],
  status: "pending",
  text: "",
});

const createErrorStateFromEvent = (
  event: OpenDetailClientErrorEvent
): OpenDetailErrorState => ({
  error: event.message,
  errorCode: event.code,
  errorParam: event.param,
  errorProvider: event.provider,
  errorProviderCode: event.providerCode,
  errorRequestId: event.requestId,
  errorRetryable: event.retryable,
  errorStatus: event.status,
});

const createErrorStateFromCaughtError = (
  caughtError: unknown
): OpenDetailErrorState => {
  const errorDetails =
    caughtError instanceof Error && isRecord(caughtError) ? caughtError : null;

  return {
    error:
      caughtError instanceof Error && caughtError.message.length > 0
        ? caughtError.message
        : DEFAULT_ERROR_MESSAGE,
    errorCode: isOpenDetailClientErrorCode(errorDetails?.code)
      ? errorDetails.code
      : null,
    errorParam:
      typeof errorDetails?.param === "string" ? errorDetails.param : null,
    errorProvider: errorDetails?.provider === "openai" ? "openai" : null,
    errorProviderCode:
      typeof errorDetails?.providerCode === "string"
        ? errorDetails.providerCode
        : null,
    errorRequestId:
      typeof errorDetails?.requestId === "string"
        ? errorDetails.requestId
        : null,
    errorRetryable:
      typeof errorDetails?.retryable === "boolean"
        ? errorDetails.retryable
        : null,
    errorStatus:
      typeof errorDetails?.status === "number" ? errorDetails.status : null,
  };
};

const applyAssistantErrorState = ({
  assistantMessageId,
  errorState,
  setMessages,
  startedAt,
}: {
  assistantMessageId: string;
  errorState: OpenDetailErrorState;
  setMessages: Dispatch<SetStateAction<OpenDetailThreadMessage[]>>;
  startedAt: number;
}) => {
  setMessages((currentMessages) =>
    updateAssistantMessage(currentMessages, assistantMessageId, (message) => ({
      ...message,
      durationLabel: toDurationLabel(startedAt),
      error: errorState.error,
      errorCode: errorState.errorCode,
      errorParam: errorState.errorParam,
      errorProvider: errorState.errorProvider,
      errorProviderCode: errorState.errorProviderCode,
      errorRequestId: errorState.errorRequestId,
      errorRetryable: errorState.errorRetryable,
      errorStatus: errorState.errorStatus,
      images: [],
      sources: [],
      status: "error",
      text: errorState.error ?? DEFAULT_ERROR_MESSAGE,
    }))
  );
};

const createCompletedAssistantMessage = (
  message: OpenDetailAssistantMessage,
  startedAt: number
): OpenDetailAssistantMessage => ({
  ...message,
  durationLabel: toDurationLabel(startedAt),
  status: "complete",
});

const createInterruptedAssistantMessage = (
  message: OpenDetailAssistantMessage,
  startedAt: number
): OpenDetailAssistantMessage => ({
  ...message,
  durationLabel: toDurationLabel(startedAt),
  error: INTERRUPTED_RESPONSE_MESSAGE,
  errorCode: null,
  errorParam: null,
  errorProvider: null,
  errorProviderCode: null,
  errorRequestId: null,
  errorRetryable: false,
  errorStatus: null,
  images: [],
  sources: [],
  status: "error",
  text:
    message.text.trim().length > 0
      ? `${message.text}\n\n${INTERRUPTED_RESPONSE_MESSAGE}`
      : message.text,
});

const finalizeStoppedAssistantMessage = ({
  assistantMessageId,
  interrupted,
  setMessages,
  startedAt,
}: {
  assistantMessageId: string;
  interrupted: boolean;
  setMessages: Dispatch<SetStateAction<OpenDetailThreadMessage[]>>;
  startedAt: number;
}) => {
  setMessages((currentMessages) =>
    currentMessages.some(
      (message) =>
        message.role === "assistant" &&
        message.id === assistantMessageId &&
        message.text.length === 0
    )
      ? removeAssistantMessage(currentMessages, assistantMessageId)
      : updateAssistantMessage(
          currentMessages,
          assistantMessageId,
          (message) =>
            interrupted
              ? createInterruptedAssistantMessage(message, startedAt)
              : createCompletedAssistantMessage(message, startedAt)
        )
  );
};

export const useOpenDetail = (
  options: UseOpenDetailOptions = {}
): UseOpenDetailState => {
  const persistenceKey = options.persistence?.key.trim();
  const persistenceStorage =
    options.persistence?.storage ?? DEFAULT_PERSISTENCE_STORAGE;
  const persistence = useMemo(
    () =>
      persistenceKey
        ? {
            key: persistenceKey,
            storage: persistenceStorage,
          }
        : null,
    [persistenceKey, persistenceStorage]
  );
  const transportCredentials = options.transport?.credentials;
  const transportEndpoint = options.transport?.endpoint ?? options.endpoint;
  const transportFetch = options.transport?.fetch;
  const transportHeaders = options.transport?.headers;
  const defaultSitePaths = options.sitePaths;
  const client = useMemo(
    () =>
      createOpenDetailClient({
        credentials: transportCredentials,
        endpoint: transportEndpoint,
        fetch: transportFetch,
        headers: transportHeaders,
      }),
    [transportCredentials, transportEndpoint, transportFetch, transportHeaders]
  );
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const hasHydratedPersistenceRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const [errorState, setErrorState] =
    useState<OpenDetailErrorState>(EMPTY_ERROR_STATE);
  const [messages, setMessages] = useState<OpenDetailThreadMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null
  );
  const [status, setStatus] = useState<OpenDetailClientStatus>("idle");

  useEffect(() => {
    hasHydratedPersistenceRef.current = false;

    if (!persistence) {
      setMessages([]);
      setQuestion("");
      setConversationTitle(null);
      hasHydratedPersistenceRef.current = true;
      return;
    }

    const persistedState = readPersistedState(persistence);

    setMessages(persistedState?.messages ?? []);
    setQuestion(persistedState?.question ?? "");
    setConversationTitle(persistedState?.conversationTitle ?? null);
    hasHydratedPersistenceRef.current = true;
  }, [persistence]);

  useEffect(() => {
    if (!(persistence && hasHydratedPersistenceRef.current)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writePersistedState({
        ...persistence,
        conversationTitle,
        messages,
        question,
      });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [conversationTitle, messages, persistence, question]);

  useEffect(() => () => client.stop(), [client]);

  const applyErrorState = (nextErrorState: OpenDetailErrorState) => {
    setErrorState(nextErrorState);
  };

  const clearActiveRequest = () => {
    activeAssistantMessageIdRef.current = null;
    startedAtRef.current = null;
  };

  const finalizeActiveRequest = ({ interrupted }: { interrupted: boolean }) => {
    const activeAssistantMessageId = activeAssistantMessageIdRef.current;
    const startedAt = startedAtRef.current;

    client.stop();
    clearActiveRequest();

    if (!activeAssistantMessageId || startedAt === null) {
      return;
    }

    finalizeStoppedAssistantMessage({
      assistantMessageId: activeAssistantMessageId,
      interrupted,
      setMessages,
      startedAt,
    });
  };

  const stop = () => {
    setStatus("idle");
    finalizeActiveRequest({
      interrupted: false,
    });
  };

  const clearThread = () => {
    client.stop();
    clearActiveRequest();
    applyErrorState(EMPTY_ERROR_STATE);
    setMessages([]);
    setQuestion("");
    setConversationTitle(null);
    setStatus("idle");

    if (persistence) {
      clearPersistedState(persistence);
    }
  };

  const submit = async (request?: OpenDetailClientRequest): Promise<void> => {
    const nextQuestion = (request?.question ?? question).trim();

    if (nextQuestion.length === 0) {
      return;
    }

    const shouldRequestConversationTitle = messages.length === 0;

    if (activeAssistantMessageIdRef.current && startedAtRef.current !== null) {
      finalizeActiveRequest({
        interrupted: true,
      });
    }

    const userMessageId = createMessageId();
    const assistantMessageId = createMessageId();
    const startedAt = Date.now();

    activeAssistantMessageIdRef.current = assistantMessageId;
    startedAtRef.current = startedAt;
    applyErrorState(EMPTY_ERROR_STATE);
    setQuestion("");
    setStatus("pending");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        question: nextQuestion,
        role: "user",
      },
      createPendingAssistantMessage(assistantMessageId),
    ]);

    try {
      await client.submit(
        {
          question: nextQuestion,
          ...(shouldRequestConversationTitle
            ? { conversationTitle: true }
            : {}),
          ...(() => {
            const sitePaths = request?.sitePaths ?? defaultSitePaths;

            return sitePaths !== undefined && sitePaths.length > 0
              ? { sitePaths }
              : {};
          })(),
        },
        {
          onEvent: (event) => {
            if (event.type === "title") {
              setConversationTitle(event.title);
              return;
            }

            applyStreamEvent({
              assistantMessageId,
              event,
              setMessages,
              startedAt,
            });

            if (event.type === "done") {
              clearActiveRequest();
            }

            if (event.type === "error") {
              applyErrorState(createErrorStateFromEvent(event));
              clearActiveRequest();
            }
          },
          onStatusChange: (nextStatus) => {
            setStatus(nextStatus);
          },
        }
      );
    } catch (caughtError) {
      if (activeAssistantMessageIdRef.current !== assistantMessageId) {
        return;
      }

      const nextErrorState = createErrorStateFromCaughtError(caughtError);

      applyErrorState(nextErrorState);
      setStatus("error");
      clearActiveRequest();
      applyAssistantErrorState({
        assistantMessageId,
        errorState: nextErrorState,
        setMessages,
        startedAt,
      });
    }
  };

  return {
    clearThread,
    conversationTitle,
    error: errorState.error,
    errorCode: errorState.errorCode,
    errorParam: errorState.errorParam,
    errorProvider: errorState.errorProvider,
    errorProviderCode: errorState.errorProviderCode,
    errorRequestId: errorState.errorRequestId,
    errorRetryable: errorState.errorRetryable,
    errorStatus: errorState.errorStatus,
    implemented: true,
    messages,
    question,
    setQuestion,
    status,
    stop,
    submit,
  };
};
