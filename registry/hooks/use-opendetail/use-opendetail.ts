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
const THREAD_STORAGE_VERSION = 1;

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
  transport?: OpenDetailTransportOptions;
}

export interface UseOpenDetailState {
  clearThread: () => void;
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

  return `${durationInSeconds}s`;
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
  value.version === THREAD_STORAGE_VERSION &&
  Array.isArray(value.messages) &&
  value.messages.every((message) => isOpenDetailThreadMessage(message)) &&
  typeof value.question === "string";

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
      messages: parsedValue.messages
        .map((message) => normalizePersistedThreadMessage(message))
        .filter((message) => message !== null),
    };
  } catch {
    return null;
  }
};

const writePersistedState = ({
  key,
  messages,
  question,
  storage,
}: OpenDetailPersistenceOptions & {
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
): OpenDetailErrorState => ({
  error:
    caughtError instanceof Error && caughtError.message.length > 0
      ? caughtError.message
      : DEFAULT_ERROR_MESSAGE,
  errorCode:
    caughtError instanceof Error && "code" in caughtError
      ? (caughtError.code as OpenDetailClientErrorCode)
      : null,
  errorParam:
    caughtError instanceof Error &&
    "param" in caughtError &&
    typeof caughtError.param === "string"
      ? caughtError.param
      : null,
  errorProvider:
    caughtError instanceof Error &&
    "provider" in caughtError &&
    caughtError.provider === "openai"
      ? "openai"
      : null,
  errorProviderCode:
    caughtError instanceof Error &&
    "providerCode" in caughtError &&
    typeof caughtError.providerCode === "string"
      ? caughtError.providerCode
      : null,
  errorRequestId:
    caughtError instanceof Error &&
    "requestId" in caughtError &&
    typeof caughtError.requestId === "string"
      ? caughtError.requestId
      : null,
  errorRetryable:
    caughtError instanceof Error &&
    "retryable" in caughtError &&
    typeof caughtError.retryable === "boolean"
      ? caughtError.retryable
      : null,
  errorStatus:
    caughtError instanceof Error &&
    "status" in caughtError &&
    typeof caughtError.status === "number"
      ? caughtError.status
      : null,
});

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
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<OpenDetailClientErrorCode | null>(
    null
  );
  const [errorParam, setErrorParam] = useState<string | null>(null);
  const [errorProvider, setErrorProvider] = useState<"openai" | null>(null);
  const [errorProviderCode, setErrorProviderCode] = useState<string | null>(
    null
  );
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorRetryable, setErrorRetryable] = useState<boolean | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [messages, setMessages] = useState<OpenDetailThreadMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<OpenDetailClientStatus>("idle");

  useEffect(() => {
    hasHydratedPersistenceRef.current = false;

    if (!persistence) {
      setMessages([]);
      setQuestion("");
      hasHydratedPersistenceRef.current = true;
      return;
    }

    const persistedState = readPersistedState(persistence);

    setMessages(persistedState?.messages ?? []);
    setQuestion(persistedState?.question ?? "");
    hasHydratedPersistenceRef.current = true;
  }, [persistence]);

  useEffect(() => {
    if (!(persistence && hasHydratedPersistenceRef.current)) {
      return;
    }

    writePersistedState({
      ...persistence,
      messages,
      question,
    });
  }, [messages, persistence, question]);

  const applyErrorState = (nextErrorState: OpenDetailErrorState) => {
    setError(nextErrorState.error);
    setErrorCode(nextErrorState.errorCode);
    setErrorParam(nextErrorState.errorParam);
    setErrorProvider(nextErrorState.errorProvider);
    setErrorProviderCode(nextErrorState.errorProviderCode);
    setErrorRequestId(nextErrorState.errorRequestId);
    setErrorRetryable(nextErrorState.errorRetryable);
    setErrorStatus(nextErrorState.errorStatus);
  };

  const stop = () => {
    const activeAssistantMessageId = activeAssistantMessageIdRef.current;
    const startedAt = startedAtRef.current;

    client.stop();
    setStatus("idle");
    activeAssistantMessageIdRef.current = null;
    startedAtRef.current = null;

    if (!activeAssistantMessageId || startedAt === null) {
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.some(
        (message) =>
          message.role === "assistant" &&
          message.id === activeAssistantMessageId &&
          message.text.length === 0
      )
        ? removeAssistantMessage(currentMessages, activeAssistantMessageId)
        : updateAssistantMessage(
            currentMessages,
            activeAssistantMessageId,
            (message) => ({
              ...message,
              durationLabel: toDurationLabel(startedAt),
              status: "complete",
            })
          )
    );
  };

  const clearThread = () => {
    client.stop();
    activeAssistantMessageIdRef.current = null;
    startedAtRef.current = null;
    applyErrorState(EMPTY_ERROR_STATE);
    setMessages([]);
    setQuestion("");
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
        },
        {
          onEvent: (event) => {
            applyStreamEvent({
              assistantMessageId,
              event,
              setMessages,
              startedAt,
            });

            if (event.type === "done") {
              activeAssistantMessageIdRef.current = null;
              startedAtRef.current = null;
            }

            if (event.type === "error") {
              applyErrorState(createErrorStateFromEvent(event));
              activeAssistantMessageIdRef.current = null;
              startedAtRef.current = null;
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
      activeAssistantMessageIdRef.current = null;
      startedAtRef.current = null;
      setMessages((currentMessages) =>
        updateAssistantMessage(
          currentMessages,
          assistantMessageId,
          (message) => ({
            ...message,
            durationLabel: toDurationLabel(startedAt),
            error: nextErrorState.error,
            errorCode: nextErrorState.errorCode,
            errorParam: nextErrorState.errorParam,
            errorProvider: nextErrorState.errorProvider,
            errorProviderCode: nextErrorState.errorProviderCode,
            errorRequestId: nextErrorState.errorRequestId,
            errorRetryable: nextErrorState.errorRetryable,
            errorStatus: nextErrorState.errorStatus,
            images: [],
            sources: [],
            status: "error",
            text: nextErrorState.error ?? DEFAULT_ERROR_MESSAGE,
          })
        )
      );
    }
  };

  return {
    clearThread,
    error,
    errorCode,
    errorParam,
    errorProvider,
    errorProviderCode,
    errorRequestId,
    errorRetryable,
    errorStatus,
    implemented: true,
    messages,
    question,
    setQuestion,
    status,
    stop,
    submit,
  };
};
