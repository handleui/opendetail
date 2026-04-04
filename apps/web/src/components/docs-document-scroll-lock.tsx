"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function pinDocumentScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Hash / layout navigation can still move the document scrollport on some browsers even when
 * `body` is `overflow: hidden`. Docs panes use nested scroll containers; keep the window pinned.
 */
export function DocsDocumentScrollLock() {
  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener("hashchange", pinDocumentScroll);

    return () => {
      window.removeEventListener("hashchange", pinDocumentScroll);
    };
  }, []);

  useEffect(() => {
    if (pathname.length >= 0) {
      pinDocumentScroll();
    }
  }, [pathname]);

  return null;
}
