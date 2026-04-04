import type { ReactNode } from "react";

import { DocsSearchBar } from "@/components/docs-search-bar";
import { DocsSidebarNav } from "@/components/docs-sidebar-nav";

/**
 * Docs chrome aligned with Figma node 36:26 — left rail (250px) with custom nav,
 * hairline `#f2f2f2` (`--opendetail-color-sidebar-stroke`). Inner column is `max-w-[650px]`; horizontal padding sits outside that width.
 * Right “Asking AI” column is {@link FumadocsAssistantSidebar}, not part of this shell.
 */
export const DocsPageShell = ({ children }: { children: ReactNode }) => (
  <div
    className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-white text-neutral-900"
    data-docs-page-shell=""
  >
    <aside
      aria-label="Documentation"
      className="hidden min-h-0 w-[250px] shrink-0 flex-col overflow-hidden border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white md:flex"
    >
      <div className="docs-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-8">
        <DocsSearchBar />
        <DocsSidebarNav />
      </div>
    </aside>
    <div className="docs-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="w-full px-6 py-8">
        <div className="mx-auto w-full max-w-[650px]">{children}</div>
      </div>
    </div>
  </div>
);
