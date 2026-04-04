"use client";

import { useCallback, useId, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/copy-button-icons";

export interface CopyCommandProps {
  /** `bunx …` (or `bun …`) command */
  bun: string;
  /** `npx …` (or `npm exec …`) command */
  npm: string;
}

const FIRST_SPACE = /\s/;

function CommandHighlight({ command }: { command: string }) {
  const trimmed = command.trim();
  const spaceIdx = trimmed.search(FIRST_SPACE);
  const first = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx);
  return (
    <code className="font-mono text-[13px] leading-relaxed">
      <span className="text-violet-600">{first}</span>
      {rest ? <span className="text-neutral-800">{rest}</span> : null}
    </code>
  );
}

/**
 * Tabbed commands (bun vs npm) with copy — for docs pages.
 */
export function CopyCommand({ bun, npm }: CopyCommandProps) {
  const tabs = [
    { command: bun, id: "bun", label: "bun" },
    { command: npm, id: "npm", label: "npm" },
  ] as const;
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const baseId = useId();

  const activeCommand = tabs[active]?.command ?? bun;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [activeCommand]);

  return (
    <div
      className="my-4 overflow-hidden rounded-lg border border-solid bg-white"
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
    >
      <div
        aria-label="Package manager"
        className="flex min-h-11 min-w-0 flex-nowrap items-stretch overflow-x-auto overflow-y-hidden border-[var(--opendetail-color-sidebar-stroke)] border-b border-solid"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              aria-controls={`${baseId}-panel`}
              aria-selected={selected}
              className={
                selected
                  ? "box-border flex shrink-0 cursor-pointer items-center border-neutral-950 border-b-2 border-solid px-4 py-2.5 font-normal text-[13px] text-neutral-950"
                  : "box-border flex shrink-0 cursor-pointer items-center border-transparent border-b-2 border-solid px-4 py-2.5 font-normal text-[13px] text-neutral-400 transition-colors hover:text-neutral-600"
              }
              id={`${baseId}-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActive(index)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        id={`${baseId}-panel`}
        role="tabpanel"
      >
        <div className="min-w-0 flex-1 overflow-x-auto">
          <CommandHighlight command={activeCommand} />
        </div>
        <button
          aria-label={copied ? "Copied" : "Copy command"}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-[color,transform] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-700 active:scale-[0.97]"
          onClick={copy}
          type="button"
        >
          <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          <span
            aria-hidden
            className="relative inline-flex size-4 items-center justify-center"
          >
            <CopyIcon
              className={`absolute size-4 transition-opacity duration-150 ease-out ${
                copied ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            />
            <CheckIcon
              className={`absolute size-4 text-emerald-600 transition-opacity duration-150 ease-out ${
                copied ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
