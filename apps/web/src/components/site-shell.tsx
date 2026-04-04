import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
    <SiteHeader />
    <div className="opendetail-main-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
      {children}
    </div>
  </div>
);
