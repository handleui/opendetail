"use client";

import { ArrowRightToLine, Check, Copy, Plus } from "lucide-react";
import { motion } from "motion/react";
import {
  type CSSProperties,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { TrifoldColumn3 } from "trifold";

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

/** Matches `--opendetail-sidebar-content-min-width` at 16px root (23.4375rem). */
const SIDEBAR_RESIZE_MIN_PX = 375;
const SIDEBAR_RESIZE_MAX_PX = 720;
const SIDEBAR_RESIZE_KEYBOARD_STEP_PX = 16;

const clampSidebarWidthPx = (value: number, maxPx: number): number =>
  Math.round(Math.min(maxPx, Math.max(SIDEBAR_RESIZE_MIN_PX, value)));

const getSidebarResizeMaxPx = (): number => {
  if (typeof window === "undefined") {
    return SIDEBAR_RESIZE_MAX_PX;
  }

  return Math.min(window.innerWidth, SIDEBAR_RESIZE_MAX_PX);
};

const MD_UP_MEDIA_QUERY = "(min-width: 768px)";

const subscribeMdUp = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {
      /* SSR: no media query subscription */
    };
  }

  const media = window.matchMedia(MD_UP_MEDIA_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
};

const getMdUpSnapshot = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(MD_UP_MEDIA_QUERY).matches;

/** Desktop layout for SSR (avoids empty first paint). */
const getMdUpServerSnapshot = (): boolean => true;

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

/** Mobile horizontal shell column (geometry); matches `trifold`’s `TrifoldColumn3`. */
export type AssistantSidebarMobileColumn = TrifoldColumn3;

export interface AssistantSidebarMobileShellSlots {
  assistant: ReactNode;
  column: TrifoldColumn3;
  main: ReactNode;
  navigation: ReactNode;
  setColumn: (column: TrifoldColumn3) => void;
}

export interface AssistantSidebarProps {
  children?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  /**
   * Docs / embed: assistant column only (no main `children` slot), bounded height, reopen
   * affordance when collapsed — matches the real sidebar chrome (header actions, thread, input).
   */
  embedded?: boolean;
  /** When `embedded`, omit the collapse control (e.g. shell primitive demo). */
  embeddedHideCollapse?: boolean;
  /** When `embedded` is set: `compact` = rounded 400px column; `dock` = flush to the preview edge as a right rail, left border only. */
  embeddedLayout?: "compact" | "dock";
  emptyState?: ReactNode;
  headerTitle?: string | null;
  hotkeyEnabled?: boolean;
  input?: ReactNode;
  inputId?: string;
  messages?: AssistantSidebarMessage[];
  /** Left site/docs navigation (desktop rail + mobile triptych first column). */
  navigation?: ReactNode;
  onClearThread?: () => void;
  onOpenChange?: (open: boolean) => void;
  onQuestionChange?: (value: string) => void;
  /** Notifies when the user resizes the panel via the drag handle (pixels). */
  onSidebarWidthChange?: (widthPx: number) => void;
  onStop?: () => void;
  onSubmitQuestion?: SubmitHandler;
  open?: boolean;
  placeholder?: string;
  promptSuggestions?: readonly string[];
  question?: string;
  /** Mobile (max breakpoint): three-panel horizontal shell (nav | main | assistant). */
  renderMobileShell?: (slots: AssistantSidebarMobileShellSlots) => ReactNode;
  renderSourceLink?: AssistantResponseProps["renderSourceLink"];
  requestState?: AssistantSidebarRequestState;
  resolveSourceTarget?: AssistantResponseProps["resolveSourceTarget"];
  /** When true, shows a drag handle on the panel edge to resize width. */
  sidebarResizeEnabled?: boolean;
  /** Controlled panel width in pixels; drives `--opendetail-sidebar-width` when set. */
  sidebarWidthPx?: number;
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

function useAssistantSidebarKeyboard({
  hotkeyEnabled,
  isControlled,
  isMobileTriptychActive,
  isSidebarOpen,
  onOpenChange,
  setInternalOpen,
  setMobileShellColumn,
  mobileShellColumn,
}: {
  hotkeyEnabled: boolean;
  isControlled: boolean;
  isMobileTriptychActive: boolean;
  isSidebarOpen: boolean;
  onOpenChange: AssistantSidebarProps["onOpenChange"];
  setInternalOpen: Dispatch<SetStateAction<boolean>>;
  setMobileShellColumn: Dispatch<SetStateAction<TrifoldColumn3>>;
  mobileShellColumn: TrifoldColumn3;
}) {
  useEffect(() => {
    if (!(hotkeyEnabled && typeof window !== "undefined")) {
      return;
    }

    const closeAssistant = () => {
      if (!isControlled) {
        setInternalOpen(false);
      }

      onOpenChange?.(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (isMobileTriptychActive && mobileShellColumn !== "center") {
        event.preventDefault();
        setMobileShellColumn("center");
        closeAssistant();
        return;
      }

      if (isSidebarOpen) {
        event.preventDefault();
        closeAssistant();
      }
    };

    const handleCmdJ = (event: KeyboardEvent) => {
      event.preventDefault();

      if (isMobileTriptychActive) {
        const nextColumn: TrifoldColumn3 =
          mobileShellColumn === "trailing" ? "center" : "trailing";
        setMobileShellColumn(nextColumn);

        if (!isControlled) {
          setInternalOpen(nextColumn === "trailing");
        }

        onOpenChange?.(nextColumn === "trailing");
        return;
      }

      const nextOpen = !isSidebarOpen;

      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (!isToggleShortcut(event)) {
        if (event.key === "Escape") {
          handleEscape(event);
        }

        return;
      }

      handleCmdJ(event);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    hotkeyEnabled,
    isControlled,
    isMobileTriptychActive,
    isSidebarOpen,
    onOpenChange,
    setInternalOpen,
    setMobileShellColumn,
    mobileShellColumn,
  ]);
}

function useAssistantSidebarOpenOnActivity({
  isControlled,
  isMobileTriptychActive,
  messages,
  onOpenChange,
  previousMessageCountRef,
  previousRequestStateRef,
  requestState,
  setInternalOpen,
  setMobileShellColumn,
}: {
  isControlled: boolean;
  isMobileTriptychActive: boolean;
  messages: AssistantSidebarMessage[];
  onOpenChange: AssistantSidebarProps["onOpenChange"];
  previousMessageCountRef: MutableRefObject<number>;
  previousRequestStateRef: MutableRefObject<AssistantSidebarRequestState>;
  requestState: AssistantSidebarRequestState;
  setInternalOpen: Dispatch<SetStateAction<boolean>>;
  setMobileShellColumn: Dispatch<SetStateAction<TrifoldColumn3>>;
}) {
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      if (isMobileTriptychActive) {
        setMobileShellColumn("trailing");
      }

      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChange?.(true);
    }

    previousMessageCountRef.current = messages.length;
  }, [
    isControlled,
    isMobileTriptychActive,
    messages.length,
    onOpenChange,
    previousMessageCountRef,
    setInternalOpen,
    setMobileShellColumn,
  ]);

  useEffect(() => {
    const previousRequestState = previousRequestStateRef.current;

    if (
      requestState !== previousRequestState &&
      (requestState === "pending" || requestState === "streaming")
    ) {
      if (isMobileTriptychActive) {
        setMobileShellColumn("trailing");
      }

      if (!isControlled) {
        setInternalOpen(true);
      }

      onOpenChange?.(true);
    }

    previousRequestStateRef.current = requestState;
  }, [
    isControlled,
    isMobileTriptychActive,
    onOpenChange,
    previousRequestStateRef,
    requestState,
    setInternalOpen,
    setMobileShellColumn,
  ]);
}

function buildAssistantAsidePanel({
  assistantPanelClassName,
  canCopy,
  emptyState,
  handleClearThread,
  handleCollapse,
  handleCopy,
  handlePromptSuggestionClick,
  handleSidebarResizeKeyDown,
  handleSidebarResizePointerDown,
  hasMessages,
  input,
  inputId,
  isBusy,
  isCopyConfirmed,
  isMobileTriptychActive,
  isSidebarOpen,
  messages,
  onQuestionChange,
  onStop,
  onSubmitQuestion,
  panelRef,
  placeholder,
  promptSuggestions,
  question,
  renderSourceLink,
  requestState,
  resolvedHeaderTitle,
  resolveSourceTarget,
  showCollapseButton,
  sidebarResizeEnabled,
  thread,
  userInitial,
}: {
  assistantPanelClassName: string;
  canCopy: boolean;
  emptyState: ReactNode;
  handleClearThread: () => void;
  handleCollapse: () => void;
  handleCopy: () => void;
  handlePromptSuggestionClick: (suggestion: string) => void;
  handleSidebarResizeKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void;
  handleSidebarResizePointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  hasMessages: boolean;
  input?: ReactNode;
  inputId?: string;
  isBusy: boolean;
  isCopyConfirmed: boolean;
  isMobileTriptychActive: boolean;
  isSidebarOpen: boolean;
  messages: AssistantSidebarMessage[];
  onQuestionChange?: (value: string) => void;
  onStop?: () => void;
  onSubmitQuestion?: SubmitHandler;
  panelRef: RefObject<HTMLElement | null>;
  placeholder: string;
  promptSuggestions: readonly string[];
  question: string;
  renderSourceLink?: AssistantResponseProps["renderSourceLink"];
  requestState: AssistantSidebarRequestState;
  resolvedHeaderTitle: string;
  resolveSourceTarget?: AssistantResponseProps["resolveSourceTarget"];
  showCollapseButton: boolean;
  sidebarResizeEnabled: boolean;
  thread?: ReactNode;
  userInitial: string;
}): ReactNode {
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
    <aside
      aria-label="OpenDetail assistant sidebar"
      className={assistantPanelClassName}
      data-opendetail-component="assistant-sidebar"
      ref={panelRef}
    >
      {sidebarResizeEnabled && isSidebarOpen && !isMobileTriptychActive ? (
        <button
          aria-label="Resize assistant panel"
          className="opendetail-sidebar__resize-handle"
          onKeyDown={handleSidebarResizeKeyDown}
          onPointerDown={handleSidebarResizePointerDown}
          type="button"
        />
      ) : null}
      <motion.div
        animate={isSidebarOpen ? "open" : "closed"}
        className="opendetail-sidebar__shell"
        initial={false}
        transition={SIDEBAR_CONTENT_TRANSITION}
        variants={sidebarContentVariants}
      >
        <header className="opendetail-sidebar__header">
          <p className="opendetail-sidebar__title">{resolvedHeaderTitle}</p>
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
            {showCollapseButton ? (
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
            ) : null}
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
  );
}

function renderAssistantSidebarRoots({
  assistantAside,
  children,
  embedded,
  isControlled,
  isMdUp,
  isMobileTriptychLayout,
  isSidebarOpen,
  navigation,
  onOpenChange,
  renderMobileShell,
  rootClassName,
  rootStyle,
  setInternalOpen,
  setMobileShellColumn,
  setSidebarOpen,
  mobileShellColumn,
}: {
  assistantAside: ReactNode;
  children: ReactNode;
  embedded: boolean;
  isControlled: boolean;
  isMdUp: boolean;
  isMobileTriptychLayout: boolean;
  isSidebarOpen: boolean;
  navigation: AssistantSidebarProps["navigation"];
  onOpenChange: AssistantSidebarProps["onOpenChange"];
  renderMobileShell: AssistantSidebarProps["renderMobileShell"];
  rootClassName: string;
  rootStyle: CSSProperties | undefined;
  setInternalOpen: Dispatch<SetStateAction<boolean>>;
  setMobileShellColumn: Dispatch<SetStateAction<TrifoldColumn3>>;
  setSidebarOpen: (nextOpen: boolean) => void;
  mobileShellColumn: TrifoldColumn3;
}): ReactNode {
  if (embedded) {
    return (
      <div className={rootClassName} style={rootStyle}>
        {isSidebarOpen ? null : (
          <div className="opendetail-sidebar__embed-reopen">
            <button
              className="opendetail-sidebar__embed-reopen-button opendetail-pressable"
              onClick={() => {
                setSidebarOpen(true);
              }}
              type="button"
            >
              Open assistant
            </button>
          </div>
        )}
        {assistantAside}
      </div>
    );
  }

  if (isMobileTriptychLayout && !isMdUp && renderMobileShell && navigation) {
    return (
      <div className={rootClassName} style={rootStyle}>
        {renderMobileShell({
          assistant: assistantAside,
          column: mobileShellColumn,
          main: children,
          navigation,
          setColumn: (column) => {
            setMobileShellColumn(column);

            if (!isControlled) {
              setInternalOpen(column === "trailing");
            }

            onOpenChange?.(column === "trailing");
          },
        })}
      </div>
    );
  }

  if (isMobileTriptychLayout && isMdUp && navigation) {
    return (
      <div className={rootClassName} style={rootStyle}>
        <div className="opendetail-sidebar__content opendetail-sidebar__content--nav-rail flex min-h-0 min-w-0 flex-1">
          <aside
            aria-label="Site navigation"
            className="flex min-h-0 w-[250px] shrink-0 flex-col overflow-hidden border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
          >
            {navigation}
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
        {assistantAside}
      </div>
    );
  }

  return (
    <div className={rootClassName} style={rootStyle}>
      <div className="opendetail-sidebar__content">{children}</div>
      {assistantAside}
    </div>
  );
}

export const AssistantSidebar = (props: AssistantSidebarProps): ReactNode => {
  const {
    children,
    className,
    defaultOpen = false,
    embedded = false,
    embeddedHideCollapse = false,
    embeddedLayout = "compact",
    emptyState = "Ask the docs",
    headerTitle,
    hotkeyEnabled = true,
    input,
    inputId,
    messages = [],
    navigation,
    onClearThread,
    onOpenChange,
    onQuestionChange,
    onSidebarWidthChange,
    onStop,
    onSubmitQuestion,
    open,
    placeholder = "Ask AI anything...",
    promptSuggestions = DEFAULT_PROMPT_SUGGESTIONS,
    question = "",
    renderMobileShell,
    renderSourceLink,
    requestState = "idle",
    resolveSourceTarget,
    sidebarResizeEnabled = false,
    sidebarWidthPx,
    thread,
    userInitial = "U",
  } = props;
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);
  const copyConfirmationTimeoutRef = useRef<number | null>(null);
  const previousMessageCountRef = useRef(messages.length);
  const previousRequestStateRef = useRef(requestState);
  const panelRef = useRef<HTMLElement | null>(null);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const [mobileShellColumn, setMobileShellColumn] = useState<TrifoldColumn3>(
    () => (open === true ? "trailing" : "center")
  );
  const isMdUp = useSyncExternalStore(
    subscribeMdUp,
    getMdUpSnapshot,
    getMdUpServerSnapshot
  );
  const isMobileTriptychLayout = Boolean(navigation && renderMobileShell);
  const isMobileTriptychActive = isMobileTriptychLayout && !isMdUp;

  useEffect(() => {
    if (!isMobileTriptychActive || open === undefined) {
      return;
    }

    setMobileShellColumn(open ? "trailing" : "center");
  }, [isMobileTriptychActive, open]);

  const embeddedLayoutResolved = embedded ? embeddedLayout : undefined;
  const showCollapseButton = !(embedded && embeddedHideCollapse);
  const isSidebarOpen = isMobileTriptychActive
    ? mobileShellColumn === "trailing"
    : (open ?? internalOpen);
  const hasMessages = messages.length > 0;
  const resolvedHeaderTitle =
    headerTitle !== undefined &&
    headerTitle !== null &&
    headerTitle.trim().length > 0
      ? headerTitle.trim()
      : "Asking AI";
  const isBusy = requestState === "pending" || requestState === "streaming";
  const transcript = getTranscriptText(messages);
  const canCopy = transcript.length > 0;

  useAssistantSidebarKeyboard({
    hotkeyEnabled,
    isControlled,
    isMobileTriptychActive,
    isSidebarOpen,
    onOpenChange,
    setInternalOpen,
    setMobileShellColumn,
    mobileShellColumn,
  });

  useAssistantSidebarOpenOnActivity({
    isControlled,
    isMobileTriptychActive,
    messages,
    onOpenChange,
    previousMessageCountRef,
    previousRequestStateRef,
    requestState,
    setInternalOpen,
    setMobileShellColumn,
  });

  useEffect(
    () => () => {
      if (copyConfirmationTimeoutRef.current !== null) {
        window.clearTimeout(copyConfirmationTimeoutRef.current);
      }
    },
    []
  );

  const setSidebarOpen = (nextOpen: boolean) => {
    if (isMobileTriptychActive) {
      setMobileShellColumn(nextOpen ? "trailing" : "center");
    }

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

  const handleSidebarResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (
        !(sidebarResizeEnabled && isSidebarOpen) ||
        isMobileTriptychActive ||
        event.button !== 0
      ) {
        return;
      }

      event.preventDefault();
      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      const startWidth = panel.getBoundingClientRect().width;
      const startX = event.clientX;
      const maxPx = getSidebarResizeMaxPx();

      setIsSidebarResizing(true);

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = startX - moveEvent.clientX;
        onSidebarWidthChange?.(clampSidebarWidthPx(startWidth + delta, maxPx));
      };

      const handleUp = () => {
        setIsSidebarResizing(false);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [
      isMobileTriptychActive,
      isSidebarOpen,
      onSidebarWidthChange,
      sidebarResizeEnabled,
    ]
  );

  const handleSidebarResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!(sidebarResizeEnabled && isSidebarOpen) || isMobileTriptychActive) {
        return;
      }

      const maxPx = getSidebarResizeMaxPx();
      const current =
        sidebarWidthPx ??
        panelRef.current?.getBoundingClientRect().width ??
        SIDEBAR_RESIZE_MIN_PX;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSidebarWidthChange?.(
          clampSidebarWidthPx(current + SIDEBAR_RESIZE_KEYBOARD_STEP_PX, maxPx)
        );
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onSidebarWidthChange?.(
          clampSidebarWidthPx(current - SIDEBAR_RESIZE_KEYBOARD_STEP_PX, maxPx)
        );
      }
    },
    [
      isMobileTriptychActive,
      isSidebarOpen,
      onSidebarWidthChange,
      sidebarResizeEnabled,
      sidebarWidthPx,
    ]
  );

  const rootStyle: CSSProperties | undefined =
    sidebarWidthPx === undefined
      ? undefined
      : { ["--opendetail-sidebar-width" as string]: `${sidebarWidthPx}px` };

  const rootClassName = [
    getClassName({ className, open: isSidebarOpen }),
    embedded && embeddedLayoutResolved === "compact"
      ? "opendetail-sidebar--embed"
      : "",
    embedded && embeddedLayoutResolved === "dock"
      ? "opendetail-sidebar--embed-dock"
      : "",
    isSidebarResizing ? "opendetail-sidebar--resizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelClassName = [
    "opendetail-sidebar__panel",
    isSidebarResizing ? "opendetail-sidebar__panel--resizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const assistantPanelClassName = [
    panelClassName,
    isMobileTriptychActive ? "opendetail-sidebar__panel--mobile-triptych" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const assistantAside = buildAssistantAsidePanel({
    assistantPanelClassName,
    canCopy,
    emptyState,
    handleClearThread,
    handleCollapse,
    handleCopy,
    handlePromptSuggestionClick,
    handleSidebarResizeKeyDown,
    handleSidebarResizePointerDown,
    hasMessages,
    input,
    inputId,
    isBusy,
    isCopyConfirmed,
    isMobileTriptychActive,
    isSidebarOpen,
    messages,
    onQuestionChange,
    onStop,
    onSubmitQuestion,
    panelRef,
    placeholder,
    promptSuggestions,
    question,
    renderSourceLink,
    requestState,
    resolvedHeaderTitle,
    resolveSourceTarget,
    showCollapseButton,
    sidebarResizeEnabled,
    thread,
    userInitial,
  });

  return renderAssistantSidebarRoots({
    assistantAside,
    children,
    embedded,
    isControlled,
    isMdUp,
    isMobileTriptychLayout,
    isSidebarOpen,
    navigation,
    onOpenChange,
    renderMobileShell,
    rootClassName,
    rootStyle,
    setInternalOpen,
    setMobileShellColumn,
    setSidebarOpen,
    mobileShellColumn,
  });
};
