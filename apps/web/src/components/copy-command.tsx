"use client";

import { useCallback, useId, useState } from "react";

export type CopyCommandProps = {
  /** `bunx …` (or `bun …`) command */
  bun: string;
  /** `npx …` (or `npm exec …`) command */
  npm: string;
};

function CommandHighlight({ command }: { command: string }) {
  const trimmed = command.trim();
  const spaceIdx = trimmed.search(/\s/);
  const first =
    spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx);
  return (
    <code className="font-mono text-[13px] leading-relaxed">
      <span className="text-violet-600">{first}</span>
      {rest ? (
        <span className="text-neutral-800">{rest}</span>
      ) : null}
    </code>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="13" rx="2" width="13" x="9" y="9" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
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
        className="flex border-[var(--opendetail-color-sidebar-stroke)] border-b border-solid"
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
                  ? "border-neutral-950 border-b-2 border-solid px-4 py-2.5 font-normal text-[13px] text-neutral-950 -mb-px"
                  : "border-b-2 border-transparent px-4 py-2.5 font-normal text-[13px] text-neutral-400 transition-colors hover:text-neutral-600"
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
          className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          onClick={copy}
          type="button"
        >
          <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          {copied ? (
            <span className="font-mono text-[11px] text-neutral-600">Copied</span>
          ) : (
            <CopyIcon className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
