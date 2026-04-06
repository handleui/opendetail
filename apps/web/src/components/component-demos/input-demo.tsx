"use client";

import { Composer, type ComposerRequest } from "opendetail-react";
import type { FormEvent } from "react";

export const InputDemo = () => {
  const handleSubmit = (
    _request: ComposerRequest,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="w-full max-w-[min(100%,var(--opendetail-input-width-shell))]">
      <Composer
        name="demo-input"
        onSubmit={handleSubmit}
        placeholder="Type a question…"
        showShellUnderlay={true}
        size="shell"
      />
    </div>
  );
};
