"use client";

import { useEffect, useState } from "react";

function pathMatchesIntent(pathname: string, intent: string): boolean {
  const normalized =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
  const intentNorm =
    intent.endsWith("/") && intent.length > 1 ? intent.slice(0, -1) : intent;
  if (normalized === intentNorm) {
    return true;
  }
  if (intentNorm === "/") {
    return normalized === "/";
  }
  return normalized.startsWith(`${intentNorm}/`);
}

/**
 * While Next.js `usePathname()` updates only after navigation completes, the secondary
 * column would briefly keep the **previous** URL’s nest when clicking top-level Docs /
 * Components. We mirror the **clicked** href as `intent` until the real pathname belongs
 * to that destination, then clear. Active states for links still use real `pathname`
 * from the router (see `SiteNavSidebar`).
 */
export function useSiteNavEffectivePathname(pathname: string): {
  effectivePathname: string;
  setNavIntent: (href: string) => void;
} {
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    if (intent === null) {
      return;
    }
    if (pathMatchesIntent(pathname, intent)) {
      setIntent(null);
    }
  }, [pathname, intent]);

  return {
    effectivePathname: intent ?? pathname,
    setNavIntent: setIntent,
  };
}
