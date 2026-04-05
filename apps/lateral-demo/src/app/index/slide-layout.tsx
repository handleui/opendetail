"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { SlideRow } from "trifold";

import { DetailView, IndexView } from "@/components/lateral/views";

const INDEX_PATH = "/index";
const DETAIL_PATH = "/index/detail";

export function IndexSlideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isDetail = pathname === DETAIL_PATH;
  const activeIndex = isDetail ? 1 : 0;

  const onActiveIndexChange = useCallback(
    (index: number) => {
      if (index === 0) {
        router.push(INDEX_PATH);
      } else {
        router.push(DETAIL_PATH);
      }
    },
    [router]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <SlideRow
        activeIndex={activeIndex}
        className="min-h-0 flex-1"
        onActiveIndexChange={onActiveIndexChange}
        panelClassName="bg-background"
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-semibold text-2xl tracking-tight">
              Index panel
            </h1>
            <Link
              className="text-sm underline underline-offset-4"
              href={DETAIL_PATH}
            >
              /index/detail
            </Link>
          </header>
          {isDetail ? <IndexView /> : children}
        </div>
        <div className="flex h-full min-h-0 flex-col overflow-y-auto p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-semibold text-2xl tracking-tight">
              Detail panel
            </h1>
            <Link
              className="text-sm underline underline-offset-4"
              href={INDEX_PATH}
            >
              /index
            </Link>
          </header>
          {isDetail ? children : <DetailView />}
        </div>
      </SlideRow>
    </div>
  );
}
