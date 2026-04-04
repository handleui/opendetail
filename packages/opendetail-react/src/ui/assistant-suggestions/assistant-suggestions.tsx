"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const getListClassName = (className?: string): string =>
  ["opendetail-assistant-suggestions", className].filter(Boolean).join(" ");

const getItemClassName = (className?: string): string =>
  ["opendetail-assistant-suggestion", "opendetail-pressable", className]
    .filter(Boolean)
    .join(" ");

export interface AssistantSuggestionsProps {
  children?: ReactNode;
  className?: string;
}

export const AssistantSuggestions = ({
  children,
  className,
}: AssistantSuggestionsProps) => (
  <div className={getListClassName(className)}>{children}</div>
);

export interface AssistantSuggestionProps {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const AssistantSuggestion = ({
  children,
  className,
  disabled = false,
  onClick,
}: AssistantSuggestionProps) => (
  <motion.button
    className={getItemClassName(className)}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {children}
  </motion.button>
);
