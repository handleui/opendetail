"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const COMPONENTS_PATH = "/components";

function isComponentsPathname(pathname: string): boolean {
  return (
    pathname === COMPONENTS_PATH || pathname.startsWith(`${COMPONENTS_PATH}/`)
  );
}

export const SiteMainWidth = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const fullWidthMain = isComponentsPathname(pathname);

  return (
    <div
      className={
        fullWidthMain
          ? "mx-auto w-full max-w-none"
          : "mx-auto w-full max-w-[650px]"
      }
    >
      {children}
    </div>
  );
};
