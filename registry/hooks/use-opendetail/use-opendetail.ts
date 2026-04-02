"use client";

import {
  type Dispatch,
  type SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createOpenDetailClient,
  type OpenDetailClientErrorCode,
  type OpenDetailClientImage,
  type OpenDetailClientRequest,
  type OpenDetailClientSource,
  type OpenDetailClientStatus,
  type OpenDetailClientStreamEvent,
} from "../../lib/opendetail-client/opendetail-client";

const DEFAULT_ERROR_MESSAGE = "OpenDetail request failed.";

export interface OpenDetailUserMessage {
  id: string;
  question: string;
  role: "user";
}

export interface OpenDetailAssistantMessage {
  durationLabel: string | null;
  error: string | null;
  errorCode: OpenDetailClientErrorCode | null;
  errorRetryable: boolean | null;
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

export interface UseOpenDetailOptions {
  endpoint?: string;
}

export interface UseOpenDetailState {
  error: string | null;
  errorCode: OpenDetailClientErrorCode | null;
  errorRetryable: boolean | null;
  implemented: true;
  messages: OpenDetailThreadMessage[];
  question: string;
  setQuestion: (value: string) => void;
  status: OpenDetailClientStatus;
  stop: () => void;
  submit: (request?: OpenDetailClientRequest) => Promise<void>;
}

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
        errorRetryable: event.retryable,
        status: "error",
        text: message.text.length > 0 ? message.text : event.message,
      };
    })
  );
};

export const useOpenDetail = (
  options: UseOpenDetailOptions = {}
): UseOpenDetailState => {
  const client = useMemo(
    () =>
      createOpenDetailClient({
        endpoint: options.endpoint,
      }),
    [options.endpoint]
  );
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<OpenDetailClientErrorCode | null>(
    null
  );
  const [errorRetryable, setErrorRetryable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<OpenDetailThreadMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<OpenDetailClientStatus>("idle");

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
      updateAssistantMessage(
        currentMessages,
        activeAssistantMessageId,
        (message) => ({
          ...message,
          durationLabel: toDurationLabel(startedAt),
          status: message.text.length > 0 ? "complete" : "error",
        })
      )
    );
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
    setError(null);
    setErrorCode(null);
    setErrorRetryable(null);
    setQuestion("");
    setStatus("pending");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        question: nextQuestion,
        role: "user",
      },
      {
        durationLabel: null,
        error: null,
        errorCode: null,
        errorRetryable: null,
        id: assistantMessageId,
        images: [],
        model: null,
        role: "assistant",
        sources: [],
        status: "pending",
        text: "",
      },
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
              setError(event.message);
              setErrorCode(event.code);
              setErrorRetryable(event.retryable);
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

      const errorMessage =
        caughtError instanceof Error && caughtError.message.length > 0
          ? caughtError.message
          : DEFAULT_ERROR_MESSAGE;
      const nextErrorCode =
        caughtError instanceof Error && "code" in caughtError
          ? (caughtError.code as OpenDetailClientErrorCode)
          : null;
      const nextErrorRetryable =
        caughtError instanceof Error &&
        "retryable" in caughtError &&
        typeof caughtError.retryable === "boolean"
          ? caughtError.retryable
          : null;

      setError(errorMessage);
      setErrorCode(nextErrorCode);
      setErrorRetryable(nextErrorRetryable);
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
            error: errorMessage,
            errorCode: nextErrorCode,
            errorRetryable: nextErrorRetryable,
            status: "error",
            text: message.text.length > 0 ? message.text : errorMessage,
          })
        )
      );
    }
  };

  return {
    error,
    errorCode,
    errorRetryable,
    implemented: true,
    messages,
    question,
    setQuestion,
    status,
    stop,
    submit,
  };
};
