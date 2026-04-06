"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/copy-button-icons";

const markdownCopyCache = new Map<string, Promise<string>>();

export function DocsPageActions({
  markdownUrl,
  githubUrl,
  layout,
  className,
}: {
  markdownUrl: string;
  githubUrl: string;
  layout: "row" | "column";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyLockRef = useRef(false);

  const copyMarkdown = useCallback(async () => {
    if (copyLockRef.current) {
      return;
    }
    copyLockRef.current = true;
    try {
      let promise = markdownCopyCache.get(markdownUrl);
      if (!promise) {
        promise = fetch(markdownUrl).then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch markdown: ${res.status}`);
          }
          return res.text();
        });
        markdownCopyCache.set(markdownUrl, promise);
      }
      const text = await promise;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    } finally {
      copyLockRef.current = false;
    }
  }, [markdownUrl]);

  const githubRow = (
    <a
      className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 transition-colors hover:text-neutral-950"
      href={githubUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Image
        alt=""
        className="block size-[14px] shrink-0 brightness-0"
        height={14}
        src="/github.svg"
        unoptimized
        width={14}
      />
      <span>GitHub</span>
    </a>
  );

  const copyRow = (
    <button
      className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-neutral-600 transition-colors hover:text-neutral-950"
      onClick={() => {
        copyMarkdown().catch(() => {
          /* ignore */
        });
      }}
      type="button"
    >
      <span className="relative inline-flex size-[14px] shrink-0 items-center justify-center">
        <CopyIcon
          className={`absolute size-[14px] transition-opacity duration-150 ${
            copied ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        />
        <CheckIcon
          className={`absolute size-[14px] transition-opacity duration-150 ${
            copied ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      </span>
      <span>Copy Markdown</span>
    </button>
  );

  if (layout === "column") {
    return (
      <div
        className={`flex flex-col gap-3 text-[13px] text-neutral-600 ${className ?? ""}`}
      >
        {githubRow}
        {copyRow}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-neutral-600 ${className ?? ""}`}
    >
      {githubRow}
      <span aria-hidden className="text-[#d4d4d4]">
        ·
      </span>
      {copyRow}
    </div>
  );
}
