"use client";

import { ArrowRightToLine, Check, Copy, Plus } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  AssistantInput,
  type AssistantInputRequest,
} from "../../ui/assistant-input/assistant-input";
import {
  AssistantResponse,
  type AssistantResponseProps,
} from "../../ui/assistant-response/assistant-response";
import type { AssistantSourceItem } from "../../ui/assistant-sources/assistant-sources";
import {
  AssistantSuggestion,
  AssistantSuggestions,
} from "../../ui/assistant-suggestions/assistant-suggestions";
import { AssistantThread } from "../../ui/assistant-thread/assistant-thread";
import { AssistantUserMessage } from "../../ui/assistant-user-message/assistant-user-message";

const getClassName = ({
  className,
  open,
}: {
  className?: string;
  open: boolean;
}): string =>
  ["opendetail-sidebar", open ? "opendetail-sidebar--open" : "", className]
    .filter(Boolean)
    .join(" ");

const isToggleShortcut = (event: KeyboardEvent): boolean =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === "j";

const isEditableTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]'
    ) !== null);

const SIDEBAR_CONTENT_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;

const sidebarContentVariants = {
  closed: {
    opacity: 0.88,
    scale: 0.98,
  },
  open: {
    opacity: 1,
    scale: 1,
  },
} as const;
const DEFAULT_PROMPT_SUGGESTIONS = [
  "What's OpenDetail and why do I need it?",
  "What AI powers OpenDetail?",
  "OpenDetail vs competitors",
] as const;

export interface AssistantSidebarImage {
  alt?: string | null;
  title?: string | null;
  url: string;
}

export interface AssistantSidebarAssistantMessage {
  durationLabel?: string | null;
  error?: string | null;
  id: string;
  images?: AssistantSidebarImage[];
  role: "assistant";
  sources?: AssistantSourceItem[];
  status: "complete" | "error" | "pending" | "streaming";
  text: string;
}

export interface AssistantSidebarUserMessage {
  id: string;
  question: string;
  role: "user";
}

export type AssistantSidebarMessage =
  | AssistantSidebarAssistantMessage
  | AssistantSidebarUserMessage;

export type AssistantSidebarRequestState =
  | "error"
  | "idle"
  | "pending"
  | "streaming";

type SubmitHandler = (request: AssistantInputRequest) => Promise<void> | void;

export interface AssistantSidebarProps {
  children?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  emptyState?: ReactNode;
  hotkeyEnabled?: boolean;
  input?: ReactNode;
  inputId?: string;
  messages?: AssistantSidebarMessage[];
  onClearThread?: () => void;
  onOpenChange?: (open: boolean) => void;
  onQuestionChange?: (value: string) => void;
  onStop?: () => void;
  onSubmitQuestion?: SubmitHandler;
  open?: boolean;
  placeholder?: string;
  promptSuggestions?: readonly string[];
  question?: string;
  renderSourceLink?: AssistantResponseProps["renderSourceLink"];
  requestState?: AssistantSidebarRequestState;
  resolveSourceTarget?: AssistantResponseProps["resolveSourceTarget"];
  thread?: ReactNode;
  userInitial?: string;
}

const getPrimaryImage = (
  message: AssistantSidebarAssistantMessage
): AssistantSidebarImage | undefined =>
  message.status === "complete" ? message.images?.[0] : undefined;

const getTranscriptText = (messages: AssistantSidebarMessage[]): string =>
  messages
    .map((message) => {
      if (message.role === "user") {
        return `User: ${message.question.trim()}`;
      }

      return `Assistant: ${message.text.trim()}`;
    })
    .filter((message) => message.length > 0)
    .join("\n\n");

const copyToClipboard = async (value: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
};

export const AssistantSidebar = ({
  children,
  className,
  defaultOpen = false,
  emptyState = "Ask the docs",
  hotkeyEnabled = true,
  input,
  inputId,
  messages = [],
  onClearThread,
  onOpenChange,
  onQuestionChange,
  onStop,
  onSubmitQuestion,
  open,
  placeholder = "Ask AI anything...",
  promptSuggestions = DEFAULT_PROMPT_SUGGESTIONS,
  question = "",
  renderSourceLink,
  requestState = "idle",
  resolveSourceTarget,
  thread,
  userInitial = "U",
}: AssistantSidebarProps) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);
  const copyConfirmationTimeoutRef = useRef<number | null>(null);
  const previousMessageCountRef = useRef(messages.length);
  const previousRequestStateRef = useRef(requestState);
  const isSidebarOpen = open ?? internalOpen;
  const hasMessages = messages.length > 0;
  const isBusy = requestState === "pending" || requestState === "streaming";
  const transcript = getTranscriptText(messages);
  const canCopy = transcript.length > 0;

  useEffect(() => {
    if (!(hotkeyEnabled && typeof window !== "undefined")) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (!isToggleShortcut(event)) {
        if (event.key === "Escape" && isSidebarOpen) {
          event.preventDefault();

          if (!isControlled) {
            setInternalOpen(false);
          }

          onOpenChange?.(false);
        }

        return;
      }

      event.preventDefault();
      const nextOpen = !isSidebarOpen;

      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hotkeyEnabled, isControlled, isSidebarOpen, onOpenChange]);

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

  useEffect(
    () => () => {
      if (copyConfirmationTimeoutRef.current !== null) {
        window.clearTimeout(copyConfirmationTimeoutRef.current);
      }
    },
    []
  );

  const setSidebarOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const handleCollapse = () => {
    setSidebarOpen(false);
  };

  const handleClearThread = () => {
    onClearThread?.();
  };

  const handleCopy = async () => {
    if (!canCopy) {
      return;
    }

    try {
      const copied = await copyToClipboard(transcript);

      if (!copied) {
        return;
      }

      setIsCopyConfirmed(true);

      if (copyConfirmationTimeoutRef.current !== null) {
        window.clearTimeout(copyConfirmationTimeoutRef.current);
      }

      copyConfirmationTimeoutRef.current = window.setTimeout(() => {
        setIsCopyConfirmed(false);
        copyConfirmationTimeoutRef.current = null;
      }, 1400);
    } catch {
      // Ignore clipboard failures to keep the assistant flow uninterrupted.
    }
  };

  const handlePromptSuggestionClick = (suggestion: string) => {
    if (isBusy) {
      return;
    }

    onSubmitQuestion?.({
      question: suggestion,
    });
  };

  const resolvedThread = thread ?? (
    <AssistantThread
      animated={isSidebarOpen && hasMessages}
      className="opendetail-sidebar__thread"
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
            renderSourceLink={renderSourceLink}
            resolveSourceTarget={resolveSourceTarget}
            sources={message.sources ?? []}
            status={message.status}
          >
            {message.text}
          </AssistantResponse>
        );
      })}
    </AssistantThread>
  );

  const resolvedInput = input ?? (
    <AssistantInput
      id={inputId}
      onStop={onStop}
      onSubmit={(request) => onSubmitQuestion?.(request)}
      onValueChange={onQuestionChange}
      placeholder={placeholder}
      requestState={requestState}
      showShellUnderlay={false}
      size="shell"
      value={question}
    />
  );

  let resolvedBody: ReactNode = resolvedThread;

  if (!hasMessages) {
    resolvedBody =
      promptSuggestions.length > 0 ? (
        <AssistantSuggestions>
          {promptSuggestions.map((suggestion) => (
            <AssistantSuggestion
              disabled={isBusy}
              key={suggestion}
              onClick={() => {
                handlePromptSuggestionClick(suggestion);
              }}
            >
              {suggestion}
            </AssistantSuggestion>
          ))}
        </AssistantSuggestions>
      ) : (
        <p className="opendetail-sidebar__empty">{emptyState}</p>
      );
  }

  return (
    <div className={getClassName({ className, open: isSidebarOpen })}>
      <div className="opendetail-sidebar__content">{children}</div>

      <aside
        aria-label="OpenDetail assistant sidebar"
        className="opendetail-sidebar__panel"
        data-opendetail-component="assistant-sidebar"
      >
        <motion.div
          animate={isSidebarOpen ? "open" : "closed"}
          className="opendetail-sidebar__shell"
          initial={false}
          transition={SIDEBAR_CONTENT_TRANSITION}
          variants={sidebarContentVariants}
        >
          <header className="opendetail-sidebar__header">
            <p className="opendetail-sidebar__title">Asking AI</p>
            <div className="opendetail-sidebar__actions">
              <motion.button
                aria-label={
                  isCopyConfirmed
                    ? "Assistant thread copied"
                    : "Copy full assistant thread"
                }
                className="opendetail-sidebar__icon-button opendetail-pressable"
                disabled={!canCopy}
                onClick={handleCopy}
                type="button"
              >
                {isCopyConfirmed ? (
                  <Check aria-hidden="true" size={14} strokeWidth={2.1} />
                ) : (
                  <Copy aria-hidden="true" size={14} strokeWidth={1.9} />
                )}
              </motion.button>
              <motion.button
                aria-label="Start a new assistant session"
                className="opendetail-sidebar__icon-button opendetail-pressable"
                onClick={handleClearThread}
                type="button"
              >
                <Plus aria-hidden="true" size={16} strokeWidth={1.9} />
              </motion.button>
              <motion.button
                aria-label="Collapse assistant sidebar"
                className="opendetail-sidebar__icon-button opendetail-pressable"
                onClick={handleCollapse}
                type="button"
              >
                <ArrowRightToLine
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.9}
                />
              </motion.button>
            </div>
          </header>

          <div
            className={[
              "opendetail-sidebar__body",
              hasMessages ? "" : "opendetail-sidebar__body--empty",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {resolvedBody}
          </div>
          <div className="opendetail-sidebar__input">{resolvedInput}</div>
        </motion.div>
      </aside>
    </div>
  );
};
