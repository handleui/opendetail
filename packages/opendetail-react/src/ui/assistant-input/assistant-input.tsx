"use client";

import { ArrowRight } from "lucide-react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { OpenDetailClientStatus } from "../../lib/opendetail-client/opendetail-client";

const DEFAULT_PLACEHOLDER = "What has Rodrigo worked on?";
const DEFAULT_NAME = "question";
const MAX_QUESTION_LENGTH = 4000;
const DEFAULT_MAX_ROWS = 6;
const TEXTAREA_LINE_HEIGHT = 21;
const TEXTAREA_VERTICAL_PADDING = 8;
const SINGLE_LINE_HEIGHT = TEXTAREA_LINE_HEIGHT + TEXTAREA_VERTICAL_PADDING;
const SCROLL_TOLERANCE = 1;

export interface AssistantInputRequest {
  question: string;
}

export interface AssistantInputStatus {
  label?: string;
  variant: "error" | "thinking";
}

type SubmitHandler = (
  request: AssistantInputRequest,
  event: FormEvent<HTMLFormElement>
) => Promise<void> | void;

export interface AssistantInputProps {
  autoFocus?: boolean;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  maxLength?: number;
  maxRows?: number;
  name?: string;
  onStop?: () => void;
  onSubmit?: SubmitHandler;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  requestState?: OpenDetailClientStatus;
  showShellUnderlay?: boolean;
  size?: "compact" | "shell";
  status?: AssistantInputStatus | null;
  value?: string;
}

type AssistantInputSize = NonNullable<AssistantInputProps["size"]>;

const getRootClassName = ({
  className,
  size,
}: {
  className?: string;
  size: AssistantInputSize;
}): string =>
  [
    "opendetail-input-root",
    size === "shell"
      ? "opendetail-input-root--shell"
      : "opendetail-input-root--compact",
    "relative isolate flex w-full flex-col items-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

const isButtonTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest("button") !== null;

const getButtonClasses = (isActive: boolean, isDisabled: boolean): string =>
  [
    "opendetail-input__action",
    isActive ? "opendetail-input__action--active" : "",
    isDisabled ? "opendetail-input__action--disabled" : "",
  ].join(" ");

const getInputId = ({ id, name }: { id?: string; name: string }): string =>
  id ?? `opendetail-input-${name}`;

const getTextareaMaxHeight = (maxRows: number): number =>
  Math.max(1, maxRows) * TEXTAREA_LINE_HEIGHT + TEXTAREA_VERTICAL_PADDING;

const getTextareaScrollState = (textarea: HTMLTextAreaElement) => {
  const canScrollUp = textarea.scrollTop > SCROLL_TOLERANCE;
  const canScrollDown =
    textarea.scrollTop + textarea.clientHeight <
    textarea.scrollHeight - SCROLL_TOLERANCE;

  return {
    canScrollDown,
    canScrollUp,
    isScrollable: canScrollUp || canScrollDown,
  };
};

const AssistantInputActionButton = ({
  isActionDisabled,
  isActive,
  isStopMode,
  size,
}: {
  isActionDisabled: boolean;
  isActive: boolean;
  isStopMode: boolean;
  size: AssistantInputSize;
}) => (
  <button
    aria-label={isStopMode ? "Stop request" : "Send question"}
    className={[
      getButtonClasses(isActive, isActionDisabled),
      "opendetail-pressable",
      size === "shell" ? "opendetail-input__action--shell" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    disabled={isActionDisabled}
    type="submit"
  >
    {isStopMode ? (
      <span aria-hidden="true" className="size-3 rounded-[2px] bg-current" />
    ) : (
      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
    )}
  </button>
);

export const AssistantInput = ({
  autoFocus = false,
  className,
  defaultValue,
  disabled = false,
  id,
  maxLength = MAX_QUESTION_LENGTH,
  maxRows = DEFAULT_MAX_ROWS,
  name = DEFAULT_NAME,
  onStop,
  onSubmit,
  onValueChange,
  placeholder = DEFAULT_PLACEHOLDER,
  readOnly = false,
  requestState = "idle",
  showShellUnderlay = true,
  size = "compact",
  value,
}: AssistantInputProps) => {
  const inputId = getInputId({ id, name });
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [scrollState, setScrollState] = useState({
    canScrollDown: false,
    canScrollUp: false,
    isScrollable: false,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const surfaceRef = useRef<HTMLFormElement>(null);

  const currentValue = value ?? internalValue;
  const request = { question: currentValue.trim() };
  const hasValue = request.question.length > 0;
  const isStopMode = requestState === "pending" || requestState === "streaming";
  const isActionDisabled = disabled || !(isStopMode || hasValue);
  const { canScrollDown, canScrollUp } = scrollState;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const syncLayoutState = () => {
      textarea.style.height = "auto";

      const maxHeight = getTextareaMaxHeight(maxRows);
      const nextHeight = Math.min(
        Math.max(SINGLE_LINE_HEIGHT, textarea.scrollHeight),
        maxHeight
      );

      textarea.style.height = `${nextHeight}px`;

      const nextScrollState = getTextareaScrollState(textarea);
      textarea.style.overflowY = nextScrollState.isScrollable
        ? "auto"
        : "hidden";

      setScrollState(nextScrollState);
    };

    syncLayoutState();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      syncLayoutState();
    });

    resizeObserver.observe(textarea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxRows]);

  const handleScroll = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    setScrollState((currentState) => {
      const nextScrollState = getTextareaScrollState(textarea);

      if (
        currentState.canScrollDown === nextScrollState.canScrollDown &&
        currentState.canScrollUp === nextScrollState.canScrollUp &&
        currentState.isScrollable === nextScrollState.isScrollable
      ) {
        return currentState;
      }

      return nextScrollState;
    });
  };

  const handleChange = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    if (isStopMode) {
      onStop?.();
      return;
    }

    if (!hasValue) {
      return;
    }

    onSubmit?.(request, event);
  };

  const handleSurfaceMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || isButtonTarget(event.target)) {
      return;
    }

    if (event.target === textareaRef.current) {
      return;
    }

    event.preventDefault();
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      disabled ||
      readOnly
    ) {
      return;
    }

    event.preventDefault();
    surfaceRef.current?.requestSubmit();
  };

  return (
    <div className={getRootClassName({ className, size })}>
      {size === "shell" && showShellUnderlay ? (
        <span aria-hidden="true" className="opendetail-input__underlay" />
      ) : null}
      <form
        aria-busy={isStopMode || undefined}
        className="opendetail-input__surface-form"
        onSubmit={handleSubmit}
        ref={surfaceRef}
      >
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: focus delegation for the composer shell */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: focus delegation for the composer shell */}
        <div
          className={[
            "opendetail-input__surface",
            disabled
              ? "opendetail-input__surface--disabled"
              : "opendetail-input__surface--interactive",
          ].join(" ")}
          data-opendetail-placeholder="assistant-input"
          onMouseDown={handleSurfaceMouseDown}
        >
          <label className="w-full" htmlFor={inputId}>
            <span className="opendetail-input__field">
              <textarea
                aria-label="Ask a question"
                autoFocus={autoFocus}
                className="opendetail-input__textarea"
                disabled={disabled}
                enterKeyHint={isStopMode ? "done" : "send"}
                id={inputId}
                maxLength={maxLength}
                name={name}
                onChange={(event) => {
                  handleChange(event.target.value);
                }}
                onKeyDown={handleTextareaKeyDown}
                onScroll={handleScroll}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={textareaRef}
                rows={1}
                spellCheck={false}
                style={{
                  height: `${SINGLE_LINE_HEIGHT}px`,
                  maxHeight: `${getTextareaMaxHeight(maxRows)}px`,
                }}
                value={currentValue}
              />
              <span
                aria-hidden="true"
                className={[
                  "opendetail-input__fade opendetail-input__fade--top",
                  canScrollUp ? "opendetail-input__fade--visible" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <span
                aria-hidden="true"
                className={[
                  "opendetail-input__fade opendetail-input__fade--bottom",
                  canScrollDown ? "opendetail-input__fade--visible" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </span>
          </label>

          <AssistantInputActionButton
            isActionDisabled={isActionDisabled}
            isActive={hasValue || isStopMode}
            isStopMode={isStopMode}
            size={size}
          />
        </div>
      </form>
    </div>
  );
};
