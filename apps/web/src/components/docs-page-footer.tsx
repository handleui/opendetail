"use client";

import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useCallback, useState } from "react";

export function DocsPageFooter({ pagePath }: { pagePath: string }) {
  const [sentiment, setSentiment] = useState<"up" | "down" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const send = useCallback(
    async (s: "up" | "down") => {
      if (submitting || sentiment !== null) {
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/docs-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: pagePath, sentiment: s }),
        });
        if (res.ok) {
          setSentiment(s);
        }
      } catch {
        // ignore
      } finally {
        setSubmitting(false);
      }
    },
    [pagePath, sentiment, submitting]
  );

  return (
    <div className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 border-[var(--opendetail-color-sidebar-stroke)] border-t border-solid pt-8 text-[14px] text-neutral-600">
      <span>Was this helpful?</span>
      <button
        aria-label="Yes"
        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={submitting || sentiment !== null}
        onClick={() => {
          send("up").catch(() => {
            /* ignore */
          });
        }}
        type="button"
      >
        <ThumbsUpIcon className="size-[14px]" strokeWidth={1.5} />
      </button>
      <button
        aria-label="No"
        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={submitting || sentiment !== null}
        onClick={() => {
          send("down").catch(() => {
            /* ignore */
          });
        }}
        type="button"
      >
        <ThumbsDownIcon className="size-[14px]" strokeWidth={1.5} />
      </button>
      {sentiment === null ? null : (
        <span className="text-[#a4a4a4] text-[13px]">
          Thanks for the feedback.
        </span>
      )}
    </div>
  );
}
