"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const CHANGELOG_PATH = "/changelog";
const DOCS_PATH = "/docs";

function isDocsPathname(pathname: string): boolean {
  return pathname === DOCS_PATH || pathname.startsWith(`${DOCS_PATH}/`);
}

function isChangelogPathname(pathname: string): boolean {
  return pathname === CHANGELOG_PATH;
}

export const SiteMainWidth = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const changelogMain = isChangelogPathname(pathname);
  const docsMain = isDocsPathname(pathname);

  let widthClass = "mx-auto w-full max-w-[650px]";
  if (changelogMain) {
    widthClass = "mx-auto w-full max-w-[52rem] px-0";
  } else if (docsMain) {
    widthClass = "mx-auto w-full max-w-[min(100%,72rem)]";
  }

  return <div className={widthClass}>{children}</div>;
};
