"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SlideRow } from "trifold";

const SAMPLE_ITEMS = [
  { id: "1", title: "Quarterly review", meta: "Notes" },
  { id: "2", title: "Design tokens", meta: "Draft" },
  { id: "3", title: "API roadmap", meta: "Published" },
  { id: "4", title: "On-call rotation", meta: "Team" },
];

function useDemoBasePath(): "/full" | "/split" {
  const pathname = usePathname();
  return pathname.startsWith("/full") ? "/full" : "/split";
}

export function IndexView() {
  const base = useDemoBasePath();
  const detailHref = `${base}/detail`;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5">
        <h2 className="font-medium text-foreground/90 text-lg">Browse</h2>
        <p className="mt-2 max-w-prose text-foreground/70 text-sm leading-relaxed">
          Starts on this panel. On a phone or tablet, swipe horizontally to move
          between panels. On desktop, use the links and buttons — the same
          controls work on touch too. Opening the detail route slides the shell
          and syncs the URL.
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
                href={detailHref}
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
        Use the top nav to compare{" "}
        <code className="text-foreground/70">/split</code> vs{" "}
        <code className="text-foreground/70">/full</code>. Split: two columns
        when wide. Full: one column; detail replaces the viewport when selected.
      </p>
    </div>
  );
}

export function DetailView() {
  const base = useDemoBasePath();
  const [nestedIndex, setNestedIndex] = useState(0);

  return (
    <article className="space-y-8">
      <header className="space-y-2 border-foreground/15 border-b pb-6">
        <p className="text-foreground/50 text-xs uppercase tracking-wider">
          Detail
        </p>
        <h2 className="font-semibold text-2xl tracking-tight">
          Right-hand surface
        </h2>
        <p className="max-w-prose text-foreground/70 text-sm">
          Same motion model as the site shell (
          <code className="text-xs">StackedPanels</code> /{" "}
          <code className="text-xs">Trifold</code>): scroll this column
          independently; add deeper stacks by nesting{" "}
          <code className="text-xs">SlideRow</code> below.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5">
        <h3 className="font-medium text-foreground/90">Checklist</h3>
        <ol className="list-inside list-decimal space-y-2 text-foreground/80 text-sm">
          <li>Confirm split vs carousel at the viewport breakpoint.</li>
          <li>Try touch swipe vs desktop link navigation.</li>
          <li>
            Use{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5 text-xs">
              data-slide-to
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
          Independent <code className="text-xs">SlideRow</code> — local index
          only; does not change the route.
        </p>
        <div className="overflow-hidden rounded-lg border border-foreground/20">
          <SlideRow
            activeIndex={nestedIndex}
            className="min-h-[140px]"
            finePointerDragEnabled={false}
            horizontalDeltaSign={-1}
            onActiveIndexChange={setNestedIndex}
          >
            <div className="flex h-full min-h-[120px] flex-col justify-center gap-3 bg-foreground/[0.02] p-4">
              <p className="text-foreground/80 text-sm">Nested panel 0</p>
              <button
                className="w-fit rounded-md border border-foreground/20 bg-foreground/[0.04] px-3 py-1.5 font-medium text-sm"
                data-slide-to="1"
                type="button"
              >
                data-slide-to → 1
              </button>
            </div>
            <div className="flex h-full min-h-[120px] flex-col justify-center gap-3 bg-foreground/[0.04] p-4">
              <p className="text-foreground/80 text-sm">Nested panel 1</p>
              <button
                className="w-fit rounded-md border border-foreground/20 px-3 py-1.5 font-medium text-sm"
                data-slide-to="0"
                type="button"
              >
                data-slide-to → 0
              </button>
            </div>
          </SlideRow>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-foreground/10 border-t pt-6">
        <button
          className="rounded-lg border border-foreground/20 bg-foreground/[0.04] px-4 py-2 font-medium text-sm"
          data-slide-to="0"
          type="button"
        >
          data-slide-to=&quot;0&quot;
        </button>
        <Link
          className="rounded-lg border border-foreground/20 px-4 py-2 font-medium text-sm"
          href={base}
        >
          Link → index
        </Link>
      </div>
    </article>
  );
}
