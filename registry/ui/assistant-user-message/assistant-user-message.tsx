import type { ReactNode } from "react";

const getClassName = (className?: string): string =>
  ["opendetail-user-message", className].filter(Boolean).join(" ");

export interface AssistantUserMessageProps {
  children?: ReactNode;
  className?: string;
  initial?: string;
}

export const AssistantUserMessage = ({
  children,
  className,
  initial = "R",
}: AssistantUserMessageProps) => (
  <article className={getClassName(className)}>
    <span aria-hidden="true" className="opendetail-user-message__badge">
      {initial}
    </span>
    <div className="opendetail-user-message__content">{children}</div>
  </article>
);
