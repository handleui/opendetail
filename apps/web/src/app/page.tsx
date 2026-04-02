"use client";

import { AssistantModal } from "@/registry/blocks/assistant-modal/assistant-modal";
import { useOpenDetail } from "@/registry/hooks/use-opendetail/use-opendetail";

export default function Home() {
  const { messages, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      persistence: {
        key: "opendetail-demo-thread",
      },
    });

  return (
    <main className="min-h-screen bg-[var(--opendetail-color-background)]">
      <AssistantModal
        inputId="opendetail-demo-question"
        messages={messages}
        onQuestionChange={setQuestion}
        onStop={stop}
        onSubmitQuestion={submit}
        placeholder="Ask about the product docs"
        question={question}
        requestState={status}
      />
    </main>
  );
}
