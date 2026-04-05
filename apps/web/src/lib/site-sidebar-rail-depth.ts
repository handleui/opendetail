"use client";

import { useEffect, useRef, useState } from "react";
import { isUnderSiteSecondaryNavPathname } from "@/lib/site-nav-tree";

export type SiteSidebarRailDepth = 0 | 1;

function initialDepthFromPathname(
  pathname: string,
  docsPathPrefix: string
): SiteSidebarRailDepth {
  if (!isUnderSiteSecondaryNavPathname(pathname, docsPathPrefix)) {
    return 0;
  }
  return 1;
}

export function useSiteSidebarRailDepth(
  pathname: string,
  docsPathPrefix: string
): {
  depth: SiteSidebarRailDepth;
  showSecondaryPanel: boolean;
  goBack: () => void;
  openSecondary: () => void;
  openHome: () => void;
} {
  const [depth, setDepth] = useState<SiteSidebarRailDepth>(() =>
    initialDepthFromPathname(pathname, docsPathPrefix)
  );

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (prev === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    const wasUnder = isUnderSiteSecondaryNavPathname(prev, docsPathPrefix);
    const nowUnder = isUnderSiteSecondaryNavPathname(pathname, docsPathPrefix);

    if (!wasUnder && nowUnder) {
      setDepth(1);
      return;
    }
    if (wasUnder && !nowUnder) {
      setDepth(0);
    }
  }, [pathname, docsPathPrefix]);

  const goBack = () => {
    setDepth(0);
  };

  const openSecondary = () => setDepth(1);
  const openHome = () => setDepth(0);

  return {
    depth,
    showSecondaryPanel: depth >= 1,
    goBack,
    openSecondary,
    openHome,
  };
}
