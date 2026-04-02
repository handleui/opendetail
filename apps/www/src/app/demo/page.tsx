"use client";

import { useState } from "react";
import {
  AssistantInput,
  type AssistantInputStatus,
} from "@/registry/ui/assistant-input/assistant-input";

const PLACEHOLDER = "What has Rodrigo worked on?";

const DEMO_STATES = [
  { label: "Idle", value: "idle" },
  { label: "Thinking", value: "thinking" },
  { label: "Error", value: "error" },
] as const;

type DemoState = (typeof DEMO_STATES)[number]["value"];

const STATUS_BY_STATE: Record<
  Exclude<DemoState, "idle">,
  AssistantInputStatus
> = {
  thinking: { variant: "thinking" },
  error: { variant: "error" },
};

const getTabClassName = (isSelected: boolean): string =>
  [
    "inline-flex min-w-20 items-center justify-center rounded-full border px-4 py-2 text-sm text-[color:var(--opendetail-color-foreground)] transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-black/20",
    isSelected
      ? "border-black bg-black text-white"
      : "border-[color:var(--opendetail-color-pill-border)] bg-[var(--opendetail-color-background)]",
  ].join(" ");

export default function DemoPage() {
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [value, setValue] = useState("");

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <div className="absolute top-10 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {DEMO_STATES.map(({ label, value: nextState }) => {
          const isSelected = demoState === nextState;

          return (
            <button
              aria-pressed={isSelected}
              className={getTabClassName(isSelected)}
              key={nextState}
              onClick={() => {
                setDemoState(nextState);
              }}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <AssistantInput
        onValueChange={setValue}
        placeholder={PLACEHOLDER}
        status={demoState === "idle" ? null : STATUS_BY_STATE[demoState]}
        value={value}
      />
    </main>
  );
}
