"use client";

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
  onOpenChange?: (open: boolean) => void;
  onQuestionChange?: (value: string) => void;
  onStop?: () => void;
  onSubmitQuestion?: SubmitHandler;
  open?: boolean;
  placeholder?: string;
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

export const AssistantSidebar = ({
  children,
  className,
  defaultOpen = false,
  emptyState = "Ask the docs",
  hotkeyEnabled = true,
  input,
  inputId,
  messages = [],
  onOpenChange,
  onQuestionChange,
  onStop,
  onSubmitQuestion,
  open,
  placeholder = "Ask about these docs",
  question = "",
  renderSourceLink,
  requestState = "idle",
  resolveSourceTarget,
  thread,
  userInitial = "U",
}: AssistantSidebarProps) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const previousMessageCountRef = useRef(messages.length);
  const previousRequestStateRef = useRef(requestState);
  const isSidebarOpen = open ?? internalOpen;

  useEffect(() => {
    if (!(hotkeyEnabled && typeof window !== "undefined")) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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

  const resolvedThread = thread ?? (
    <AssistantThread
      animated={isSidebarOpen && messages.length > 0}
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
          <div
            className={[
              "opendetail-sidebar__body",
              messages.length === 0 ? "opendetail-sidebar__body--empty" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {messages.length === 0 ? (
              <p className="opendetail-sidebar__empty">{emptyState}</p>
            ) : (
              resolvedThread
            )}
          </div>
          <div className="opendetail-sidebar__input">{resolvedInput}</div>
        </motion.div>
      </aside>
    </div>
  );
};
