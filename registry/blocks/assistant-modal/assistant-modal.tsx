import type { ReactNode } from "react";

interface AssistantModalProps {
  children?: ReactNode;
}

export const AssistantModal = ({ children }: AssistantModalProps) => (
  <section
    aria-label="OpenDetail assistant modal placeholder"
    data-opendetail-placeholder="assistant-modal"
  >
    {children}
  </section>
);
