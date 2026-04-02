"use client";

import { AssistantSidebar } from "../../../../registry/blocks/assistant-sidebar/assistant-sidebar";
import { useOpenDetail } from "../../../../registry/hooks/use-opendetail/use-opendetail";

export const DocsAssistantSidebar = () => {
  const { messages, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      persistence: {
        key: "opendetail-docs-sidebar",
      },
    });

  return (
    <AssistantSidebar
      inputId="opendetail-docs-question"
      label="Ask the docs"
      messages={messages}
      onQuestionChange={setQuestion}
      onStop={stop}
      onSubmitQuestion={submit}
      placeholder="Ask about these docs"
      question={question}
      requestState={status}
      shortcutLabel="Cmd/Ctrl J"
    />
  );
};
