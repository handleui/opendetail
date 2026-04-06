"use client";

import Link from "next/link";
import { useState } from "react";
import { ParallelTrack } from "trifold";

export const SAMPLE_ITEMS = [
  { id: "1", title: "Quarterly review", meta: "Notes" },
  { id: "2", title: "Design tokens", meta: "Draft" },
  { id: "3", title: "API roadmap", meta: "Published" },
  { id: "4", title: "On-call rotation", meta: "Team" },
] as const;

const BASE = "/full";
const DETAIL_HREF = `${BASE}/detail`;

export function IndexView() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5">
        <h2 className="font-medium text-foreground/90 text-lg">Browse</h2>
        <p className="mt-2 max-w-prose text-foreground/70 text-sm leading-relaxed">
          One full-width surface at a time: the shell slides between index and
          detail and keeps the URL in sync. On phones, swipe horizontally; on
          desktop, use links and header buttons.
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-medium text-foreground/80 text-sm uppercase tracking-wide">
          Items
        </h3>
        <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/15">
          {SAMPLE_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-foreground/[0.04]"
                href={`${DETAIL_HREF}?id=${item.id}`}
              >
                <span className="font-medium">{item.title}</span>
                <span className="shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-foreground/60 text-xs">
                  {item.meta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-foreground/55 text-xs leading-relaxed">
        Each row goes to{" "}
        <code className="text-foreground/70">/full/detail?id=…</code> so the
        detail panel always matches the address bar — no second column fighting
        the route.
      </p>
    </div>
  );
}

export function DetailView({ itemId }: { itemId: string | null }) {
  const [nestedIndex, setNestedIndex] = useState(0);
  const item = itemId
    ? (SAMPLE_ITEMS.find((i) => i.id === itemId) ?? null)
    : null;

  return (
    <article className="space-y-8">
      <header className="space-y-2 border-foreground/15 border-b pb-6">
        <p className="text-foreground/50 text-xs uppercase tracking-wider">
          Detail
        </p>
        <h2 className="font-semibold text-2xl tracking-tight">
          {item ? item.title : "Right-hand surface"}
        </h2>
        <p className="max-w-prose text-foreground/70 text-sm">
          {item ? (
            <>
              <span className="text-foreground/80">{item.meta}</span> · Same
              motion model as the site shell (
              <code className="text-xs">ScrollPanels</code> /{" "}
              <code className="text-xs">Trifold</code>): one panel visible;
              scroll independently; nest{" "}
              <code className="text-xs">ParallelTrack</code> below for deeper
              local stacks.
            </>
          ) : (
            <>
              Same motion model as the site shell (
              <code className="text-xs">ScrollPanels</code> /{" "}
              <code className="text-xs">Trifold</code>): scroll this column
              independently; add deeper stacks by nesting{" "}
              <code className="text-xs">ParallelTrack</code> below.
            </>
          )}
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5">
        <h3 className="font-medium text-foreground/90">Checklist</h3>
        <ol className="list-inside list-decimal space-y-2 text-foreground/80 text-sm">
          <li>
            Resize the window: still one column; no side-by-side master–detail.
          </li>
          <li>Try touch swipe vs desktop link navigation.</li>
          <li>
            Use{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5 text-xs">
              data-parallel-index
            </code>{" "}
            for in-row jumps without routing.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5">
        <h3 className="font-medium text-foreground/90">
          Nested slide (deeper stack)
        </h3>
        <p className="text-foreground/70 text-sm">
          Independent <code className="text-xs">ParallelTrack</code> — local
          index only; does not change the route.
        </p>
        <div className="overflow-hidden rounded-lg border border-foreground/20">
          <ParallelTrack
            activeIndex={nestedIndex}
            className="min-h-[140px]"
            horizontalDeltaSign={-1}
            onActiveIndexChange={setNestedIndex}
          >
            <div className="flex h-full min-h-[120px] flex-col justify-center gap-3 bg-foreground/[0.02] p-4">
              <p className="text-foreground/80 text-sm">Nested panel 0</p>
              <button
                className="w-fit rounded-md border border-foreground/20 bg-foreground/[0.04] px-3 py-1.5 font-medium text-sm"
                data-parallel-index="1"
                type="button"
              >
                data-parallel-index → 1
              </button>
            </div>
            <div className="flex h-full min-h-[120px] flex-col justify-center gap-3 bg-foreground/[0.04] p-4">
              <p className="text-foreground/80 text-sm">Nested panel 1</p>
              <button
                className="w-fit rounded-md border border-foreground/20 bg-foreground/[0.04] px-3 py-1.5 font-medium text-sm"
                data-parallel-index="0"
                type="button"
              >
                data-parallel-index → 0
              </button>
            </div>
          </ParallelTrack>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-foreground/10 border-t pt-6">
        <button
          className="rounded-lg border border-foreground/20 bg-foreground/[0.04] px-4 py-2 font-medium text-sm"
          data-parallel-index="0"
          type="button"
        >
          data-parallel-index=&quot;0&quot;
        </button>
        <Link
          className="rounded-lg border border-foreground/20 px-4 py-2 font-medium text-sm"
          href={BASE}
        >
          Link → index
        </Link>
      </div>
    </article>
  );
}
