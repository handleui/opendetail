import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
    <Navbar />
    <div className="site-shell__main opendetail-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      {children}
    </div>
  </div>
);
