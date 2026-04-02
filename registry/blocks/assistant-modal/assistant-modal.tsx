"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  AssistantInput,
  type AssistantInputRequest,
} from "../../ui/assistant-input/assistant-input";
import { AssistantResponse } from "../../ui/assistant-response/assistant-response";
import type { AssistantSourceItem } from "../../ui/assistant-sources/assistant-sources";
import { AssistantThread } from "../../ui/assistant-thread/assistant-thread";
import { AssistantUserMessage } from "../../ui/assistant-user-message/assistant-user-message";

const getClassName = (className?: string): string =>
  ["opendetail-modal", className].filter(Boolean).join(" ");

export interface AssistantModalImage {
  alt?: string | null;
  title?: string | null;
  url: string;
}

export interface AssistantModalAssistantMessage {
  durationLabel?: string | null;
  error?: string | null;
  id: string;
  images?: AssistantModalImage[];
  role: "assistant";
  sources?: AssistantSourceItem[];
  status: "complete" | "error" | "pending" | "streaming";
  text: string;
}

export interface AssistantModalUserMessage {
  id: string;
  question: string;
  role: "user";
}

export type AssistantModalMessage =
  | AssistantModalAssistantMessage
  | AssistantModalUserMessage;

export type AssistantModalRequestState =
  | "error"
  | "idle"
  | "pending"
  | "streaming";

type SubmitHandler = (request: AssistantInputRequest) => Promise<void> | void;

export interface AssistantModalProps {
  className?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  input?: ReactNode;
  inputId?: string;
  messages?: AssistantModalMessage[];
  onCloseThread?: () => void;
  onOpenChange?: (open: boolean) => void;
  onQuestionChange?: (value: string) => void;
  onStop?: () => void;
  onSubmitQuestion?: SubmitHandler;
  open?: boolean;
  placeholder?: string;
  question?: string;
  requestState?: AssistantModalRequestState;
  thread?: ReactNode;
  userInitial?: string;
}

const getPrimaryImage = (
  message: AssistantModalAssistantMessage
): AssistantModalImage | undefined =>
  message.status === "complete" ? message.images?.[0] : undefined;

export const AssistantModal = ({
  className,
  closeLabel = "Close thread",
  defaultOpen = false,
  input,
  inputId,
  messages = [],
  onCloseThread,
  onOpenChange,
  onQuestionChange,
  onStop,
  onSubmitQuestion,
  open,
  placeholder = "Ask about the product docs",
  question = "",
  requestState = "idle",
  thread,
  userInitial = "U",
}: AssistantModalProps) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const previousMessageCountRef = useRef(messages.length);
  const previousRequestStateRef = useRef(requestState);
  const isThreadOpen = open ?? internalOpen;

  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChange?.(true);
    }

    previousMessageCountRef.current = messages.length;
  }, [isControlled, messages.length, onOpenChange]);

  useEffect(() => {
    const previousRequestState = previousRequestStateRef.current;

    if (
      requestState !== previousRequestState &&
      (requestState === "pending" || requestState === "streaming")
    ) {
      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChange?.(true);
    }

    previousRequestStateRef.current = requestState;
  }, [isControlled, onOpenChange, requestState]);

  const handleCloseThread = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }

    onOpenChange?.(false);
    onCloseThread?.();
  };

  const resolvedThread =
    thread ??
    (messages.length > 0 ? (
      <AssistantThread
        animated={isThreadOpen}
        className="opendetail-modal__thread"
      >
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <AssistantUserMessage initial={userInitial} key={message.id}>
                {message.question}
              </AssistantUserMessage>
            );
          }

          const primaryImage = getPrimaryImage(message);

          return (
            <AssistantResponse
              error={message.error ?? null}
              image={
                primaryImage
                  ? {
                      alt:
                        primaryImage.alt ??
                        primaryImage.title ??
                        "Retrieved documentation reference",
                      src: primaryImage.url,
                    }
                  : null
              }
              key={message.id}
              meta={{
                durationLabel: message.durationLabel ?? undefined,
                sourceCount: message.sources?.length ?? 0,
              }}
              sources={message.sources ?? []}
              status={message.status}
            >
              {message.text}
            </AssistantResponse>
          );
        })}
      </AssistantThread>
    ) : null);

  const resolvedInput = input ?? (
    <AssistantInput
      id={inputId}
      onStop={onStop}
      onSubmit={(request) => onSubmitQuestion?.(request)}
      onValueChange={onQuestionChange}
      placeholder={placeholder}
      requestState={requestState}
      size="shell"
      value={question}
    />
  );

  const shouldShowThread = isThreadOpen && resolvedThread !== null;

  return (
    <section
      aria-label="OpenDetail assistant modal"
      className={getClassName(className)}
      data-opendetail-component="assistant-modal"
    >
      <div
        aria-hidden="true"
        className={[
          "opendetail-modal__scrim",
          shouldShowThread ? "opendetail-modal__scrim--visible" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {shouldShowThread ? (
        <>
          <div className="opendetail-modal__close">
            <button
              className="opendetail-modal__close-button"
              onClick={handleCloseThread}
              type="button"
            >
              {closeLabel}
            </button>
          </div>

          <div className="opendetail-modal__thread-layer">{resolvedThread}</div>
        </>
      ) : null}

      <div className="opendetail-modal__input-layer">{resolvedInput}</div>
    </section>
  );
};
