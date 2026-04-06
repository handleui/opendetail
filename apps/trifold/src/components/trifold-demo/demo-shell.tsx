"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollPanels } from "trifold";

import { DetailView, IndexView } from "@/components/trifold-demo/views";

const CONTENT_MAX = "max-w-[1080px]";
const BASE = "/full";
const DETAIL_PATH = `${BASE}/detail`;

export function TrifoldDemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDetail = pathname === DETAIL_PATH;

  const indexFromPath = isDetail ? 1 : 0;
  const [slideIndex, setSlideIndex] = useState(indexFromPath);

  useEffect(() => {
    setSlideIndex(indexFromPath);
  }, [indexFromPath]);

  const onActiveIndexChange = useCallback(
    (index: number) => {
      setSlideIndex(index);
      router.push(index === 0 ? BASE : DETAIL_PATH);
    },
    [router]
  );

  const activeIndex = slideIndex;

  const shell: ReactNode = (
    <ScrollPanels
      activeIndex={activeIndex}
      className="min-h-0 flex-1"
      contentMaxWidthClassName={CONTENT_MAX}
      density="comfortable"
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
            isDetail ? undefined : "flex min-h-full flex-col justify-center"
          }
          key="index"
        >
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-foreground/10 border-b pb-4">
            <div>
              <p className="text-foreground/50 text-xs uppercase tracking-wider">
                Panel 0 · Index
              </p>
              <h1 className="font-semibold text-3xl tracking-tight">Index</h1>
            </div>
            <Link
              className="shrink-0 rounded-lg border border-foreground/20 bg-foreground/[0.04] px-3 py-2 font-medium text-sm"
              href={DETAIL_PATH}
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
                Panel 1 · Detail
              </p>
              <h1 className="font-semibold text-3xl tracking-tight">Detail</h1>
            </div>
            <Link
              className="shrink-0 rounded-lg border border-foreground/20 px-3 py-2 font-medium text-sm"
              href={BASE}
            >
              ← Index
            </Link>
          </header>
          {isDetail ? children : <DetailView itemId={null} />}
        </div>,
      ]}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background px-3 text-foreground sm:px-5">
      <nav className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-foreground/10 border-b bg-foreground/[0.03] py-2 text-foreground/80 text-xs sm:px-2">
        <span>
          <code className="rounded bg-foreground/10 px-1">ScrollPanels</code> ·
          One column at a time · URL sync · Desktop: links · Touch: swipe ·{" "}
          <code className="rounded bg-foreground/10 px-1">
            horizontalDeltaSign −1
          </code>
        </span>
      </nav>

      {shell}
    </div>
  );
}
