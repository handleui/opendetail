"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const COMPONENTS_PATH = "/components";
const CHANGELOG_PATH = "/changelog";

function isComponentsPathname(pathname: string): boolean {
  return (
    pathname === COMPONENTS_PATH || pathname.startsWith(`${COMPONENTS_PATH}/`)
  );
}

function isChangelogPathname(pathname: string): boolean {
  return pathname === CHANGELOG_PATH;
}

export const SiteMainWidth = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const fullWidthMain = isComponentsPathname(pathname);
  const changelogMain = isChangelogPathname(pathname);

  let widthClass = "mx-auto w-full max-w-[650px]";
  if (fullWidthMain) {
    widthClass = "mx-auto w-full max-w-none";
  } else if (changelogMain) {
    widthClass = "mx-auto w-full max-w-[52rem] px-0";
  }

  return <div className={widthClass}>{children}</div>;
};
