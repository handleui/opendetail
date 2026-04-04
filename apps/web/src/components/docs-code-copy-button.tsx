"use client";

import { useCallback, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/copy-button-icons";

export interface DocsCodeCopyButtonProps {
  text: string;
}

/**
 * Copy control for docs code blocks — matches {@link CopyCommand} affordances.
 */
export function DocsCodeCopyButton({ text }: DocsCodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      aria-label={copied ? "Copied" : "Copy code"}
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
  );
}
