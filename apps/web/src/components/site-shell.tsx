import type { ReactNode } from "react";

import { SiteMainWidth } from "@/components/site-main-width";

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
    <div className="site-shell__main flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div
        className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white text-neutral-900"
        data-docs-page-shell=""
      >
        <div className="docs-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="w-full px-6 py-10">
            <SiteMainWidth>{children}</SiteMainWidth>
          </div>
        </div>
      </div>
    </div>
  </div>
);
