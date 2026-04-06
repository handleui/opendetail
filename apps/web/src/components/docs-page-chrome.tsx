"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { AnchorProvider } from "fumadocs-core/toc";
import type { ReactNode } from "react";

import { DocsPageFooter } from "@/components/docs-page-footer";
import { DocsPageToolbar } from "@/components/docs-page-toolbar";
import { DocsToc } from "@/components/docs-toc";

export function DocsPageChrome({
  toc,
  markdownUrl,
  githubUrl,
  feedbackPath,
  lead,
  pageTitle,
  preview,
  children,
  variant = "docs",
}: {
  toc: readonly TOCItemType[];
  markdownUrl: string;
  githubUrl: string;
  feedbackPath: string;
  /** Optional block before the title (e.g. docs index landing header), inside the article column. */
  lead?: ReactNode;
  /** When set, rendered in the article column so the title aligns with body copy. */
  pageTitle?: string;
  /** Full-width live demo above the article, same width as article + TOC (theme pages only). */
  preview?: ReactNode;
  children: ReactNode;
  /**
   * `docs` — leading `1fr` column for asymmetric page balance (routes under `/docs`).
   * `theme` — article + TOC only for UI sandbox pages (`/ui`).
   */
  variant?: "docs" | "theme" | "components";
}) {
  const isThemeLayout = variant === "theme" || variant === "components";
  const hasPreview = Boolean(preview) && isThemeLayout;
  /** Slightly above `xl` (1280px): show TOC + grid only when the main column has enough room. */
  const contentRowClass = hasPreview
    ? "min-[1350px]:row-start-2"
    : "min-[1350px]:row-start-1";

  return (
    <AnchorProvider toc={[...toc]}>
      <div
        className={
          isThemeLayout
            ? "flex w-full min-w-0 flex-col gap-8 min-[1350px]:grid min-[1350px]:grid-cols-[minmax(0,650px)_minmax(11rem,14rem)] min-[1350px]:items-start min-[1350px]:gap-x-16"
            : "flex flex-col gap-8 min-[1350px]:grid min-[1350px]:grid-cols-[minmax(0,1fr)_minmax(0,650px)_minmax(11rem,14rem)] min-[1350px]:items-start min-[1350px]:gap-x-16"
        }
      >
        {isThemeLayout ? null : (
          <div
            aria-hidden
            className="hidden min-h-px min-w-0 min-[1350px]:col-start-1 min-[1350px]:row-start-1 min-[1350px]:block"
          />
        )}

        {hasPreview ? (
          <div className="min-w-0 min-[1350px]:col-span-2 min-[1350px]:row-start-1">
            {preview}
          </div>
        ) : null}

        <div
          className={
            isThemeLayout
              ? `mx-auto w-full min-w-0 max-w-[650px] min-[1350px]:col-start-1 ${contentRowClass} min-[1350px]:w-full`
              : "mx-auto w-full min-w-0 max-w-[650px] min-[1350px]:col-start-2 min-[1350px]:row-start-1 min-[1350px]:w-full"
          }
        >
          {lead ?? null}
          {pageTitle === undefined ? null : (
            <header className="mb-6">
              <h1 className="font-normal text-[28px] text-neutral-950 tracking-[-0.04em]">
                {pageTitle}
              </h1>
            </header>
          )}
          <div className="mb-6 min-[1350px]:hidden">
            <DocsPageToolbar githubUrl={githubUrl} markdownUrl={markdownUrl} />
          </div>
          {children}
          <DocsPageFooter pagePath={feedbackPath} />
        </div>

        <DocsToc
          githubUrl={githubUrl}
          gridColumnStart={isThemeLayout ? 2 : 3}
          gridRowStart={hasPreview ? 2 : 1}
          markdownUrl={markdownUrl}
          toc={toc}
        />
      </div>
    </AnchorProvider>
  );
}
