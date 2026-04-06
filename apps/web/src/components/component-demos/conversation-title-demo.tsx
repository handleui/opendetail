"use client";

import { AssistantInput, type AssistantInputRequest } from "opendetail-react";
import { type FormEvent, useState } from "react";

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;

/**
 * Minimal title demo: submitting sets the header string from the question (no streaming).
 */
export const ConversationTitleDemo = () => {
  const [title, setTitle] = useState("New chat");

  const handleSubmit = (
    request: AssistantInputRequest,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const q = request.question.trim();
    if (!q) {
      return;
    }
    setTitle(truncate(q, 48));
  };

  return (
    <div className="flex min-h-[min(70vh,22rem)] w-full max-w-[400px] flex-col items-center justify-center gap-6">
      <p className="px-2 text-center font-medium text-[15px] text-neutral-950">
        {title}
      </p>
      <div className="w-full">
        <AssistantInput
          name="conversation-title-demo"
          onSubmit={handleSubmit}
          placeholder="Send a message — the title follows your query"
          showShellUnderlay={true}
          size="shell"
        />
      </div>
    </div>
  );
};
