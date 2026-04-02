"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { FormEvent, MouseEvent, RefObject } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import type { OpenDetailClientStatus } from "../../lib/opendetail-client/opendetail-client";
import {
  AssistantStatus,
  type AssistantStatusVariant,
} from "../assistant-status/assistant-status";

const DEFAULT_PLACEHOLDER = "What has Rodrigo worked on?";
const DEFAULT_NAME = "question";
const INPUT_WIDTH = 450;
const SINGLE_LINE_HEIGHT = 20;
const HORIZONTAL_CHROME = 50;
const MAX_QUESTION_LENGTH = 4000;
const LAYOUT_TRANSITION = {
  damping: 32,
  mass: 0.85,
  stiffness: 420,
  type: "spring",
} as const;

export interface AssistantInputRequest {
  question: string;
}

export interface AssistantInputStatus {
  label?: string;
  variant: AssistantStatusVariant;
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
  name?: string;
  onStop?: () => void;
  onSubmit?: SubmitHandler;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  requestState?: OpenDetailClientStatus;
  status?: AssistantInputStatus | null;
  value?: string;
}

const getMeasureWidth = (width: number) =>
  Math.max(width - HORIZONTAL_CHROME, SINGLE_LINE_HEIGHT);

const isButtonTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest("button") !== null;

const getButtonClasses = (isActive: boolean, isDisabled: boolean): string =>
  [
    "flex size-5 shrink-0 items-center justify-center rounded transition-colors",
    isDisabled ? "cursor-not-allowed" : "cursor-pointer",
    isActive ? "bg-black text-white" : "bg-zinc-200 text-zinc-400",
  ].join(" ");

const getStatusFromRequestState = (
  requestState: OpenDetailClientStatus
): AssistantInputStatus | null => {
  if (requestState === "error") {
    return { variant: "error" };
  }

  if (requestState === "pending" || requestState === "streaming") {
    return { variant: "thinking" };
  }

  return null;
};

const useSurfaceWidth = (surfaceRef: RefObject<HTMLFormElement | null>) => {
  const [surfaceWidth, setSurfaceWidth] = useState(INPUT_WIDTH);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;

    if (!surface) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setSurfaceWidth(entry.contentRect.width);
    });

    setSurfaceWidth(surface.clientWidth);
    resizeObserver.observe(surface);

    return () => {
      resizeObserver.disconnect();
    };
  }, [surfaceRef]);

  return surfaceWidth;
};

const useMeasuredMultiline = ({
  hasValue,
  measureRef,
  question,
  width,
}: {
  hasValue: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
  question: string;
  width: number;
}) => {
  const [isMultiline, setIsMultiline] = useState(question.trim().length > 0);

  useLayoutEffect(() => {
    const measure = measureRef.current;

    if (!measure) {
      return;
    }

    const shouldWrap =
      hasValue &&
      question.length > 0 &&
      width > 0 &&
      measure.offsetHeight > SINGLE_LINE_HEIGHT + 1;

    setIsMultiline(shouldWrap);
  }, [hasValue, measureRef, question, width]);

  return isMultiline;
};

const useTextareaHeight = ({
  isMultiline,
  question,
  textareaRef,
}: {
  isMultiline: boolean;
  question: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) => {
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = `${SINGLE_LINE_HEIGHT}px`;

    if (!isMultiline && question.length === 0) {
      return;
    }

    textarea.style.height = `${Math.max(SINGLE_LINE_HEIGHT, textarea.scrollHeight)}px`;
  }, [isMultiline, question, textareaRef]);
};

const AssistantInputStatusPill = ({
  status,
}: {
  status: AssistantInputStatus | null;
}) => (
  <AnimatePresence initial={false} mode="wait">
    {status ? (
      <motion.div
        animate={
          status.variant === "error"
            ? { opacity: 1, x: [0, -2, 2, -1, 1, 0], y: 0 }
            : { opacity: 1, x: 0, y: 0 }
        }
        className="shrink-0"
        exit={{ opacity: 0, y: 1 }}
        initial={{ opacity: 0, y: 1.5 }}
        key={`${status.variant}-${status.label ?? ""}`}
        transition={{
          duration: status.variant === "error" ? 0.32 : 0.18,
          ease: "easeOut",
          times:
            status.variant === "error" ? [0, 0.2, 0.4, 0.6, 0.8, 1] : undefined,
        }}
      >
        <AssistantStatus label={status.label} variant={status.variant} />
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const AssistantInputActionButton = ({
  isActionDisabled,
  isActive,
  isStopMode,
}: {
  isActionDisabled: boolean;
  isActive: boolean;
  isStopMode: boolean;
}) => (
  <motion.button
    aria-label={isStopMode ? "Stop request" : "Send question"}
    className={getButtonClasses(isActive, isActionDisabled)}
    disabled={isActionDisabled}
    layout
    transition={LAYOUT_TRANSITION}
    type="submit"
  >
    {isStopMode ? (
      <span aria-hidden="true" className="size-2 rounded-[1px] bg-white" />
    ) : (
      <ArrowRight aria-hidden="true" className="size-3" strokeWidth={2} />
    )}
  </motion.button>
);

export const AssistantInput = ({
  autoFocus = false,
  className,
  defaultValue,
  disabled = false,
  id,
  maxLength = MAX_QUESTION_LENGTH,
  name = DEFAULT_NAME,
  onStop,
  onSubmit,
  onValueChange,
  placeholder = DEFAULT_PLACEHOLDER,
  readOnly = false,
  requestState = "idle",
  status,
  value,
}: AssistantInputProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const surfaceRef = useRef<HTMLFormElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const currentValue = value ?? internalValue;
  const request = { question: currentValue.trim() };
  const hasValue = request.question.length > 0;
  const resolvedStatus = status ?? getStatusFromRequestState(requestState);
  const isStopMode = resolvedStatus !== null;
  const isActionDisabled = disabled || !(isStopMode || hasValue);
  const surfaceWidth = useSurfaceWidth(surfaceRef);
  const isMultiline = useMeasuredMultiline({
    hasValue,
    measureRef,
    question: currentValue,
    width: surfaceWidth,
  });

  useTextareaHeight({
    isMultiline,
    question: currentValue,
    textareaRef,
  });

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

  const handleSurfaceMouseDown = (event: MouseEvent<HTMLFormElement>) => {
    if (disabled || isButtonTarget(event.target)) {
      return;
    }

    if (event.target === textareaRef.current) {
      return;
    }

    event.preventDefault();
    textareaRef.current?.focus();
  };

  return (
    <div className="relative flex w-full max-w-[450px] flex-col items-center">
      <AssistantInputStatusPill status={resolvedStatus} />

      <motion.form
        aria-busy={isStopMode || undefined}
        className={[
          "min-h-10 w-full overflow-hidden rounded-xl bg-zinc-50 p-2.5",
          resolvedStatus ? "mt-4" : "",
          isMultiline
            ? "flex flex-col items-end gap-2.5"
            : "flex items-center gap-2.5",
          disabled ? "cursor-not-allowed" : "cursor-text",
          className ?? "",
        ].join(" ")}
        data-opendetail-placeholder="assistant-input"
        layout
        onMouseDown={handleSurfaceMouseDown}
        onSubmit={handleSubmit}
        ref={surfaceRef}
        transition={LAYOUT_TRANSITION}
      >
        <label
          className={isMultiline ? "w-full" : "min-w-0 flex-1"}
          htmlFor={inputId}
        >
          <span className="sr-only">Ask a question</span>
          <textarea
            autoFocus={autoFocus}
            className={[
              "w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-normal text-black text-sm leading-5 tracking-[-0.04em] outline-none placeholder:text-zinc-400",
              disabled ? "cursor-not-allowed" : "cursor-text",
            ].join(" ")}
            disabled={disabled}
            id={inputId}
            maxLength={maxLength}
            name={name}
            onChange={(event) => {
              handleChange(event.target.value);
            }}
            placeholder={placeholder}
            readOnly={readOnly}
            ref={textareaRef}
            rows={1}
            spellCheck={false}
            style={{ height: `${SINGLE_LINE_HEIGHT}px` }}
            value={currentValue}
          />
        </label>

        <AssistantInputActionButton
          isActionDisabled={isActionDisabled}
          isActive={hasValue || isStopMode}
          isStopMode={isStopMode}
        />
      </motion.form>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre-wrap break-words font-normal text-sm leading-5 tracking-[-0.04em]"
        ref={measureRef}
        style={{ width: `${getMeasureWidth(surfaceWidth)}px` }}
      >
        {currentValue || "\u200B"}
      </div>
    </div>
  );
};
