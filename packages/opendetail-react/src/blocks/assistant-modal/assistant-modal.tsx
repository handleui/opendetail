"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AssistantMessage,
  type AssistantMessageProps,
} from "../../ui/assistant-message/assistant-message";
import type { AssistantSourceItem } from "../../ui/assistant-sources/assistant-sources";
import { Composer, type ComposerRequest } from "../../ui/composer/composer";
import { ConversationLayout } from "../../ui/conversation-layout/conversation-layout";
import { Thread } from "../../ui/thread/thread";
import { UserMessage } from "../../ui/user-message/user-message";

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

type SubmitHandler = (request: ComposerRequest) => Promise<void> | void;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((element) => !element.hasAttribute("hidden"));

const trapDialogFocus = ({
  dialog,
  event,
}: {
  dialog: HTMLElement | null;
  event: KeyboardEvent;
}) => {
  if (!dialog) {
    return;
  }

  const focusableElements = getFocusableElements(dialog);

  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (!(firstElement && lastElement)) {
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

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
  renderSourceLink?: AssistantMessageProps["renderSourceLink"];
  requestState?: AssistantModalRequestState;
  resolveSourceTarget?: AssistantMessageProps["resolveSourceTarget"];
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
  renderSourceLink,
  requestState = "idle",
  resolveSourceTarget,
  thread,
  userInitial = "U",
}: AssistantModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogElementRef = useRef<HTMLDivElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousMessageCountRef = useRef(messages.length);
  const previousRequestStateRef = useRef(requestState);
  const isThreadOpen = open ?? internalOpen;

  const handleCloseThread = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false);
    }

    onOpenChangeRef.current?.(false);
    onCloseThread?.();
  }, [isControlled, onCloseThread]);

  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChangeRef.current?.(true);
    }

    previousMessageCountRef.current = messages.length;
  }, [isControlled, messages.length]);

  useEffect(() => {
    const previousRequestState = previousRequestStateRef.current;

    if (
      requestState !== previousRequestState &&
      (requestState === "pending" || requestState === "streaming")
    ) {
      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChangeRef.current?.(true);
    }

    previousRequestStateRef.current = requestState;
  }, [isControlled, requestState]);

  const resolvedThread =
    thread ??
    (messages.length > 0 ? (
      <Thread animated={isThreadOpen} className="opendetail-modal__thread">
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <UserMessage initial={userInitial} key={message.id}>
                {message.question}
              </UserMessage>
            );
          }

          const primaryImage = getPrimaryImage(message);

          return (
            <AssistantMessage
              error={message.error ?? null}
              image={
                primaryImage
                  ? {
                      alt:
                        primaryImage.alt ??
                        primaryImage.title ??
                        "Retrieved source image",
                      src: primaryImage.url,
                    }
                  : null
              }
              key={message.id}
              meta={{
                durationLabel: message.durationLabel ?? undefined,
              }}
              renderSourceLink={renderSourceLink}
              resolveSourceTarget={resolveSourceTarget}
              sources={message.sources ?? []}
              status={message.status}
            >
              {message.text}
            </AssistantMessage>
          );
        })}
      </Thread>
    ) : null);

  const shouldShowThread = isThreadOpen && resolvedThread !== null;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (!shouldShowThread) {
      const previousFocusedElement = previousFocusedElementRef.current;

      if (previousFocusedElement && document.contains(previousFocusedElement)) {
        previousFocusedElement.focus();
      }

      previousFocusedElementRef.current = null;
      return;
    }

    if (
      !previousFocusedElementRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      previousFocusedElementRef.current = document.activeElement;
    }

    const focusTarget = closeButtonRef.current ?? dialogElementRef.current;

    focusTarget?.focus();
  }, [shouldShowThread]);

  useEffect(() => {
    if (!shouldShowThread) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        handleCloseThread();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      trapDialogFocus({
        dialog: dialogElementRef.current,
        event,
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCloseThread, shouldShowThread]);

  const handleSubmitQuestion = useCallback(
    (request: ComposerRequest) => {
      onSubmitQuestion?.(request);
    },
    [onSubmitQuestion]
  );

  const setDialogElementRef = useCallback((node: HTMLDivElement | null) => {
    dialogElementRef.current = node;
  }, []);

  const resolvedInput = input ?? (
    <Composer
      id={inputId}
      onStop={onStop}
      onSubmit={handleSubmitQuestion}
      onValueChange={onQuestionChange}
      placeholder={placeholder}
      requestState={requestState}
      showShellUnderlay={false}
      size="shell"
      value={question}
    />
  );

  return (
    <div
      aria-label="OpenDetail assistant modal"
      aria-modal={shouldShowThread || undefined}
      className={getClassName(className)}
      data-od-system="opendetail"
      data-opendetail-component="assistant-modal"
      ref={setDialogElementRef}
      role="dialog"
      tabIndex={shouldShowThread ? -1 : undefined}
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
        <div className="opendetail-modal__close">
          <button
            className="opendetail-modal__close-button opendetail-pressable"
            onClick={handleCloseThread}
            ref={closeButtonRef}
            type="button"
          >
            {closeLabel}
          </button>
        </div>
      ) : null}

      <ConversationLayout
        input={resolvedInput}
        modalShowThread={shouldShowThread}
        thread={resolvedThread}
        variant="modal"
      />
    </div>
  );
};
