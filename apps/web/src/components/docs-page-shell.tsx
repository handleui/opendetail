import type { ReactNode } from "react";

/**
 * Docs chrome aligned with Figma node 36:26 — empty white left rail (250px),
 * hairline `#f2f2f2` (`--opendetail-color-sidebar-stroke`), main column centers ~651px content.
 * Right “Asking AI” column is {@link FumadocsAssistantSidebar}, not part of this shell.
 */
export const DocsPageShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-0 flex-1 bg-white text-neutral-900">
    <aside
      aria-label="Documentation"
      className="hidden w-[250px] shrink-0 border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white md:block"
    />
    <div className="opendetail-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[652px] px-6 py-8">{children}</div>
    </div>
  </div>
);
