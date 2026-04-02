import type { ReactNode } from "react";

interface AssistantSidebarProps {
  children?: ReactNode;
}

export const AssistantSidebar = ({ children }: AssistantSidebarProps) => (
  <section
    aria-label="OpenDetail assistant sidebar placeholder"
    data-opendetail-placeholder="assistant-sidebar"
  >
    {children}
  </section>
);
