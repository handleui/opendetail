"use client";

import type { ReactNode } from "react";

const getClassName = (className?: string): string =>
  ["opendetail-user-message", className].filter(Boolean).join(" ");

export interface UserMessageProps {
  children?: ReactNode;
  className?: string;
  initial?: string;
}

export const UserMessage = ({
  children,
  className,
  initial: _initial = "R",
}: UserMessageProps) => (
  <article className={getClassName(className)}>
    {/*
    <span aria-hidden="true" className="opendetail-user-message__badge">
      {_initial}
    </span>
    */}
    <div className="opendetail-user-message__content">{children}</div>
  </article>
);
