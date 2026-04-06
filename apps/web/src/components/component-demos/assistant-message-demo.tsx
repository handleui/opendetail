"use client";

import { AssistantMessage } from "opendetail-react";

export const AssistantMessageDemo = () => (
  <div className="flex w-full max-w-md flex-1 flex-col">
    <AssistantMessage status="complete">
      **Assistant** reply with markdown — lists, `code`, and short answers.
    </AssistantMessage>
  </div>
);
