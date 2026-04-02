import type { ReactNode } from "react";

interface AssistantResponseProps {
  children?: ReactNode;
}

export const AssistantResponse = ({ children }: AssistantResponseProps) => (
  <article data-opendetail-placeholder="assistant-response">
    {children ?? null}
  </article>
);
