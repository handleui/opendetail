"use client";

import { useEffect, useRef, useState } from "react";
import { isCliDocsPathname, isUnderDocsPathname } from "./docs-nav-tree";

/**
 * Nested sidebar rail depth (slides left → right as depth increases).
 * Not tied to the browser URL except when the route crosses docs/CLI boundaries.
 */
export type SidebarRailDepth = 0 | 1 | 2;

function initialDepthFromPathname(
  pathname: string,
  docsPathPrefix: string
): SidebarRailDepth {
  if (!isUnderDocsPathname(pathname, docsPathPrefix)) {
    return 0;
  }
  if (isCliDocsPathname(pathname, docsPathPrefix)) {
    return 2;
  }
  return 1;
}

/**
 * Single stack for the docs sidebar: Home (0) → docs tree (1) → CLI drill-in (2).
 * `goBack` always moves exactly one step toward 0 — never navigates the page.
 * Pathname only adjusts depth on real route transitions (enter/leave docs or CLI).
 */
export function useSidebarRailDepth(
  pathname: string,
  docsPathPrefix: string
): {
  depth: SidebarRailDepth;
  showDocsPanel: boolean;
  showCliInnerSlide: boolean;
  goBack: () => void;
  openDocs: () => void;
  openHome: () => void;
} {
  const [depth, setDepth] = useState<SidebarRailDepth>(() =>
    initialDepthFromPathname(pathname, docsPathPrefix)
  );

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (prev === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    const wasUnder = isUnderDocsPathname(prev, docsPathPrefix);
    const nowUnder = isUnderDocsPathname(pathname, docsPathPrefix);
    const wasCli = isCliDocsPathname(prev, docsPathPrefix);
    const nowCli = isCliDocsPathname(pathname, docsPathPrefix);

    if (!wasUnder && nowUnder) {
      setDepth(1);
      return;
    }
    if (wasUnder && !nowUnder) {
      setDepth(0);
      return;
    }
    if (nowUnder && !wasCli && nowCli) {
      setDepth(2);
      return;
    }
    if (wasCli && nowUnder && !nowCli) {
      setDepth(1);
      return;
    }
  }, [pathname, docsPathPrefix]);

  const goBack = () => {
    setDepth((d) => (d > 0 ? ((d - 1) as SidebarRailDepth) : 0));
  };

  const openDocs = () => setDepth(1);
  const openHome = () => setDepth(0);

  return {
    depth,
    showDocsPanel: depth >= 1,
    showCliInnerSlide: depth >= 2,
    goBack,
    openDocs,
    openHome,
  };
}
