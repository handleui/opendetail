"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { TOCItem } from "fumadocs-core/toc";

import { DocsPageActions } from "@/components/docs-page-actions";

function tocItemPadding(depth: number): number {
  const base = Math.max(0, depth - 2);
  return base * 10;
}

export function DocsToc({
  toc,
  markdownUrl,
  githubUrl,
  gridColumnStart = 3,
  gridRowStart = 1,
}: {
  toc: readonly TOCItemType[];
  markdownUrl: string;
  githubUrl: string;
  /** Grid column for `xl` layout: `2` when there is no leading spacer column (components docs). */
  gridColumnStart?: 2 | 3;
  /** Row for article + TOC when a full-width preview sits in row 1 (component detail pages). */
  gridRowStart?: 1 | 2;
}) {
  /** Wider than default `xl` (1280px) so article stays readable with the assistant sidebar open. */
  const colStart =
    gridColumnStart === 2
      ? "min-[1420px]:col-start-2"
      : "min-[1420px]:col-start-3";
  const rowStart =
    gridRowStart === 2
      ? "min-[1420px]:row-start-2"
      : "min-[1420px]:row-start-1";

  return (
    <aside
      className={`hidden w-[min(100%,14rem)] shrink-0 min-[1420px]:sticky min-[1420px]:top-8 min-[1420px]:block min-[1420px]:max-h-[calc(100vh-2rem)] min-[1420px]:self-start min-[1420px]:overflow-y-auto min-[1420px]:overscroll-contain min-[1420px]:[scrollbar-width:none] min-[1420px]:[&::-webkit-scrollbar]:hidden ${rowStart} ${colStart}`}
    >
      <div className="flex flex-col gap-6 pb-4">
        {toc.length > 0 ? (
          <nav aria-label="On this page">
            <p className="mb-2 font-normal text-[#a4a4a4] text-[13px] tracking-tight">
              On this page
            </p>
            <ul className="flex flex-col gap-1">
              {toc.map((item) => (
                <li key={item.url}>
                  <TOCItem
                    className="block text-[13px] text-neutral-600 leading-snug transition-colors hover:text-neutral-950 data-[active=true]:text-neutral-950"
                    href={item.url}
                    style={{ paddingInlineStart: tocItemPadding(item.depth) }}
                  >
                    {item.title}
                  </TOCItem>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <section aria-label="Page actions">
          <p className="mb-2 font-normal text-[#a4a4a4] text-[13px] tracking-tight">
            Actions
          </p>
          <DocsPageActions
            githubUrl={githubUrl}
            layout="column"
            markdownUrl={markdownUrl}
          />
        </section>
      </div>
    </aside>
  );
}
