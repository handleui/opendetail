"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const UI_DOCS_PATH = "/ui";
const CHANGELOG_PATH = "/changelog";
const DOCS_PATH = "/docs";

function isDocsPathname(pathname: string): boolean {
  return pathname === DOCS_PATH || pathname.startsWith(`${DOCS_PATH}/`);
}

function isUiDocsPathname(pathname: string): boolean {
  return pathname === UI_DOCS_PATH || pathname.startsWith(`${UI_DOCS_PATH}/`);
}

function isChangelogPathname(pathname: string): boolean {
  return pathname === CHANGELOG_PATH;
}

export const SiteMainWidth = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const fullWidthMain = isUiDocsPathname(pathname);
  const changelogMain = isChangelogPathname(pathname);
  const docsMain = isDocsPathname(pathname);

  /** Matches `DocsPageChrome` theme grid at `min-[1350px]`: article (650) + gap + TOC (≤14rem). */
  const componentsDocsMax = "max-w-[min(100%,calc(650px+4rem+14rem))]";

  let widthClass = "mx-auto w-full max-w-[650px]";
  if (fullWidthMain) {
    widthClass = `mx-auto w-full ${componentsDocsMax}`;
  } else if (changelogMain) {
    widthClass = "mx-auto w-full max-w-[52rem] px-0";
  } else if (docsMain) {
    widthClass = "mx-auto w-full max-w-[min(100%,72rem)]";
  }

  return <div className={widthClass}>{children}</div>;
};
