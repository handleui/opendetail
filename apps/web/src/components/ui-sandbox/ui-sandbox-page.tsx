"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

import { PrimitiveDocPanel } from "@/components/ui-sandbox/primitive-doc-panel";
import { SandboxPreviewIframe } from "@/components/ui-sandbox/sandbox-preview-iframe";
import { SandboxToolbar } from "@/components/ui-sandbox/sandbox-toolbar";
import {
  isSandboxPrimitiveId,
  SANDBOX_THEME_IDS,
  type SandboxPrimitiveId,
  type SandboxThemeId,
} from "@/lib/ui-sandbox/primitives";

function UiSandboxShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const primitive: SandboxPrimitiveId = useMemo(() => {
    const raw = searchParams.get("primitive");
    return raw && isSandboxPrimitiveId(raw) ? raw : "shell";
  }, [searchParams]);

  const theme: SandboxThemeId = useMemo(() => {
    const raw = searchParams.get("theme");
    return raw && (SANDBOX_THEME_IDS as readonly string[]).includes(raw)
      ? (raw as SandboxThemeId)
      : "default";
  }, [searchParams]);

  const setParams = useCallback(
    (next: { primitive?: SandboxPrimitiveId; theme?: SandboxThemeId }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next.primitive !== undefined) {
        p.set("primitive", next.primitive);
      }
      if (next.theme !== undefined) {
        p.set("theme", next.theme);
      }
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-8">
      <SandboxToolbar
        onPrimitiveChange={(v) => {
          setParams({ primitive: v });
        }}
        onThemeChange={(v) => {
          setParams({ theme: v });
        }}
        primitive={primitive}
        theme={theme}
      />

      <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0">
          <SandboxPreviewIframe primitive={primitive} theme={theme} />
        </div>
        <div className="min-h-0 min-w-0 border-neutral-200 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <PrimitiveDocPanel id={primitive} />
        </div>
      </div>
    </div>
  );
}

export function UiSandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-[14px] text-neutral-500">Loading…</div>
      }
    >
      <UiSandboxShell />
    </Suspense>
  );
}
