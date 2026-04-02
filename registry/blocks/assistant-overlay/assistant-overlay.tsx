import type { ReactNode } from "react";

interface AssistantOverlayProps {
  children?: ReactNode;
}

export const AssistantOverlay = ({ children }: AssistantOverlayProps) => (
  <section
    aria-label="OpenDetail assistant overlay placeholder"
    data-opendetail-placeholder="assistant-overlay"
  >
    {children}
  </section>
);
