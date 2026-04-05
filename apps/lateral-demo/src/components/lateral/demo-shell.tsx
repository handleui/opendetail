"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StackedPanels } from "trifold";

import { DetailView, IndexView } from "@/components/lateral/views";

export function LateralDemoShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "full" | "split";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = variant === "split" ? "/split" : "/full";
  const detailPath = `${base}/detail`;
  const isDetail = pathname === detailPath;
  const indexFromPath = isDetail ? 1 : 0;
  const [slideIndex, setSlideIndex] = useState(indexFromPath);
  const splitMode = variant === "split";

  useEffect(() => {
    setSlideIndex(indexFromPath);
  }, [indexFromPath]);

  const activeIndex = slideIndex;
  /** `/split` starts as one-column carousel; opt in to two columns when wide. */
  const [twoColumnSplit, setTwoColumnSplit] = useState(false);
  const splitLayoutActive = splitMode && twoColumnSplit;

  const onActiveIndexChange = useCallback(
    (index: number) => {
      setSlideIndex(index);
      router.push(index === 0 ? base : detailPath);
    },
    [base, detailPath, router]
  );

  let panelModeLabel = "Full";
  if (splitMode) {
    panelModeLabel = twoColumnSplit ? "Split · columns" : "Split";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <nav className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-foreground/10 border-b bg-foreground/[0.03] px-4 py-2 text-foreground/80 text-xs">
        <Link
          className="rounded-md px-2 py-1 font-medium hover:bg-foreground/10"
          href="/split"
        >
          /split
        </Link>
        <Link
          className="rounded-md px-2 py-1 font-medium hover:bg-foreground/10"
          href="/full"
        >
          /full
        </Link>
        <span className="text-foreground/45">·</span>
        {splitMode ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Starts carousel; enable two columns for wide side-by-side · With
              two columns: links/buttons only (no swipe in split)
            </span>
            <button
              className="rounded-md border border-foreground/20 bg-foreground/[0.06] px-2 py-1 font-medium hover:bg-foreground/10"
              onClick={() => setTwoColumnSplit((v) => !v)}
              type="button"
            >
              {twoColumnSplit ? "Two columns: on" : "Two columns: off"}
            </button>
          </span>
        ) : (
          <span>
            <code className="rounded bg-foreground/10 px-1">StackedPanels</code>{" "}
            (same model as site{" "}
            <code className="rounded bg-foreground/10 px-1">Trifold</code>) ·
            Touch: swipe · Desktop: links/buttons ·{" "}
            <code className="rounded bg-foreground/10 px-1">
              horizontalDeltaSign −1
            </code>
          </span>
        )}
      </nav>

      <StackedPanels
        activeIndex={activeIndex}
        className="min-h-0 flex-1"
        contentMaxWidthClassName={
          variant === "full" ? "max-w-[1080px]" : undefined
        }
        density={variant === "full" ? "comfortable" : "compact"}
        finePointerDragEnabled={false}
        horizontalDeltaSign={-1}
        onActiveIndexChange={onActiveIndexChange}
        panelClassName={(i) =>
          [i === 0 ? "border-e border-foreground/20" : ""]
            .filter(Boolean)
            .join(" ")
        }
        panels={[
          <div
            className={
              splitLayoutActive || isDetail
                ? undefined
                : "flex min-h-full flex-col justify-center"
            }
            key="index"
          >
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-foreground/10 border-b pb-4">
              <div>
                <p className="text-foreground/50 text-xs uppercase tracking-wider">
                  {panelModeLabel} · Panel 0 · Index
                </p>
                <h1 className="font-semibold text-3xl tracking-tight">Index</h1>
              </div>
              <Link
                className="shrink-0 rounded-lg border border-foreground/20 bg-foreground/[0.04] px-3 py-2 font-medium text-sm"
                href={detailPath}
              >
                Open detail →
              </Link>
            </header>
            {isDetail ? <IndexView /> : children}
          </div>,
          <div key="detail">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-foreground/10 border-b pb-4">
              <div>
                <p className="text-foreground/50 text-xs uppercase tracking-wider">
                  {panelModeLabel} · Panel 1 · Detail
                </p>
                <h1 className="font-semibold text-3xl tracking-tight">
                  Detail
                </h1>
              </div>
              <Link
                className="shrink-0 rounded-lg border border-foreground/20 px-3 py-2 font-medium text-sm"
                href={base}
              >
                ← Index
              </Link>
            </header>
            {isDetail ? children : <DetailView />}
          </div>,
        ]}
        splitLayout={splitLayoutActive ? { minWidthPx: 1024 } : false}
        splitPointerNavigation={splitLayoutActive ? false : undefined}
      />
    </div>
  );
}
