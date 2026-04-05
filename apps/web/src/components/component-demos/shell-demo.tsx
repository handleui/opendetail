"use client";

import {
  AssistantInput,
  type AssistantInputRequest,
  AssistantShell,
} from "opendetail-react";
import type { FormEvent } from "react";

export const ShellDemo = () => {
  const handleSubmit = (
    _request: AssistantInputRequest,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="max-h-[min(75vh,40rem)] w-full max-w-[min(100%,var(--opendetail-shell-max-width))] overflow-y-auto">
      <AssistantShell
        input={
          <AssistantInput
            name="demo-question"
            onSubmit={handleSubmit}
            placeholder="Ask something…"
            showShellUnderlay={true}
            size="shell"
          />
        }
        thread={
          <p className="px-1 text-[14px] text-[var(--opendetail-color-meta)]">
            Thread area — messages and sources render here.
          </p>
        }
      />
    </div>
  );
};
