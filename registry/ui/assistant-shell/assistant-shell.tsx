import type { ReactNode } from "react";

interface AssistantShellProps {
  children?: ReactNode;
}

export const AssistantShell = ({ children }: AssistantShellProps) => (
  <section
    aria-label="OpenDetail assistant shell placeholder"
    data-opendetail-placeholder="assistant-shell"
  >
    {children}
  </section>
);
