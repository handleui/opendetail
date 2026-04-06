"use client";

import { AssistantMessage, Thread, UserMessage } from "opendetail-react";

export const ThreadDemo = () => (
  <div className="flex min-h-0 w-full max-w-md flex-1 flex-col">
    <Thread>
      <UserMessage>What is OpenDetail?</UserMessage>
      <AssistantMessage status="complete">
        OpenDetail is a local-first assistant runtime with NDJSON streaming and
        React primitives you can theme.
      </AssistantMessage>
    </Thread>
  </div>
);
