"use client";

import { AssistantInput, type AssistantInputRequest } from "opendetail-react";
import type { FormEvent } from "react";

export const InputDemo = () => {
  const handleSubmit = (
    _request: AssistantInputRequest,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="w-full max-w-[min(100%,var(--opendetail-input-width-shell))]">
      <AssistantInput
        name="demo-input"
        onSubmit={handleSubmit}
        placeholder="Type a question…"
        showShellUnderlay={true}
        size="shell"
      />
    </div>
  );
};
