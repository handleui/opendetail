"use client";

import type { ReactNode } from "react";

import { AssistantSidebar } from "../../../../registry/blocks/assistant-sidebar/assistant-sidebar";
import { useOpenDetail } from "../../../../registry/hooks/use-opendetail/use-opendetail";

export const DocsAssistantShell = ({ children }: { children: ReactNode }) => {
  const { messages, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      persistence: {
        key: "opendetail-docs-sidebar",
      },
    });

  return (
    <AssistantSidebar
      inputId="opendetail-docs-question"
      messages={messages}
      onQuestionChange={setQuestion}
      onStop={stop}
      onSubmitQuestion={submit}
      placeholder="Ask about these docs"
      question={question}
      requestState={status}
    >
      {children}
    </AssistantSidebar>
  );
};
