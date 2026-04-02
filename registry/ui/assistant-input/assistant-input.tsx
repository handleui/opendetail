"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { FormEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { OpenDetailClientStatus } from "../../lib/opendetail-client/opendetail-client";

const DEFAULT_PLACEHOLDER = "What has Rodrigo worked on?";
const DEFAULT_NAME = "question";
const MAX_QUESTION_LENGTH = 4000;
const SINGLE_LINE_HEIGHT = 24;
const LAYOUT_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
} as const;
const MOTION_LAYOUT_TRANSITION = { layout: LAYOUT_TRANSITION } as const;

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
  name?: string;
  onStop?: () => void;
  onSubmit?: SubmitHandler;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  requestState?: OpenDetailClientStatus;
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
    "relative flex w-full flex-col items-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

const isButtonTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest("button") !== null;

const getButtonClasses = (isActive: boolean, isDisabled: boolean): string =>
  [
    "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
    isDisabled ? "cursor-not-allowed" : "cursor-pointer",
    isActive ? "bg-black text-white" : "bg-zinc-200 text-zinc-400",
  ].join(" ");

const getInputId = ({ id, name }: { id?: string; name: string }): string =>
  id ?? `opendetail-input-${name}`;

const useTextareaLayout = ({
  question,
  textareaRef,
}: {
  question: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) => {
  const [isMultiline, setIsMultiline] = useState(false);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.max(SINGLE_LINE_HEIGHT, textarea.scrollHeight);
    textarea.style.height = `${nextHeight}px`;
    setIsMultiline(question.length > 0 && nextHeight > SINGLE_LINE_HEIGHT + 1);
  }, [question, textareaRef]);

  return isMultiline;
};

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
    layout="position"
    transition={MOTION_LAYOUT_TRANSITION}
    type="submit"
  >
    {isStopMode ? (
      <span aria-hidden="true" className="size-3 rounded-[2px] bg-white" />
    ) : (
      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
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
  size = "compact",
  value,
}: AssistantInputProps) => {
  const inputId = getInputId({ id, name });
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const surfaceRef = useRef<HTMLFormElement>(null);

  const currentValue = value ?? internalValue;
  const request = { question: currentValue.trim() };
  const hasValue = request.question.length > 0;
  const isStopMode = requestState === "pending" || requestState === "streaming";
  const isActionDisabled = disabled || !(isStopMode || hasValue);
  const isMultiline = useTextareaLayout({
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
    <motion.div
      className={getRootClassName({ className, size })}
      layout
      transition={MOTION_LAYOUT_TRANSITION}
    >
      <motion.form
        aria-busy={isStopMode || undefined}
        className={[
          "min-h-12 w-full overflow-hidden rounded-xl bg-zinc-50 p-2.5",
          isMultiline
            ? "flex flex-col items-end gap-2.5"
            : "flex items-center gap-2.5",
          disabled ? "cursor-not-allowed" : "cursor-text",
        ].join(" ")}
        data-opendetail-placeholder="assistant-input"
        layout
        onMouseDown={handleSurfaceMouseDown}
        onSubmit={handleSubmit}
        ref={surfaceRef}
        style={{ borderRadius: 12 }}
        transition={MOTION_LAYOUT_TRANSITION}
      >
        <motion.label
          className={isMultiline ? "w-full" : "min-w-0 flex-1"}
          htmlFor={inputId}
          layout="position"
          transition={MOTION_LAYOUT_TRANSITION}
        >
          <span className="sr-only">Ask a question</span>
          <textarea
            autoFocus={autoFocus}
            className={[
              "block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-normal text-base text-black leading-6 tracking-[-0.04em] outline-none placeholder:text-zinc-400",
              isMultiline ? "" : "-translate-y-px pl-0.5",
              disabled ? "cursor-not-allowed" : "cursor-text",
            ].join(" ")}
            disabled={disabled}
            enterKeyHint={isStopMode ? "done" : "send"}
            id={inputId}
            maxLength={maxLength}
            name={name}
            onChange={(event) => {
              handleChange(event.target.value);
            }}
            onKeyDown={handleTextareaKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            ref={textareaRef}
            rows={1}
            spellCheck={false}
            style={{ height: `${SINGLE_LINE_HEIGHT}px` }}
            value={currentValue}
          />
        </motion.label>

        <AssistantInputActionButton
          isActionDisabled={isActionDisabled}
          isActive={hasValue || isStopMode}
          isStopMode={isStopMode}
        />
      </motion.form>
    </motion.div>
  );
};
