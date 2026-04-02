import type { ReactNode } from "react";

const getClassName = (className?: string): string =>
  ["opendetail-shell", className].filter(Boolean).join(" ");

export interface AssistantShellProps {
  children?: ReactNode;
  className?: string;
  input: ReactNode;
  thread?: ReactNode;
}

export const AssistantShell = ({
  children,
  className,
  input,
  thread,
}: AssistantShellProps) => (
  <section
    aria-label="OpenDetail assistant shell"
    className={getClassName(className)}
  >
    <div className="opendetail-shell__thread">{thread ?? children ?? null}</div>
    <div className="opendetail-shell__input">{input}</div>
  </section>
);
