"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

/**
 * Sidebar trigger (Figma 54:34) — opens the Fumadocs default search dialog
 * (`RootProvider` search + `/api/search`).
 */
export function DocsSearchBar() {
  const { setOpenSearch, enabled } = useSearchContext();

  if (!enabled) {
    return null;
  }

  return (
    <button
      aria-label="Search documentation"
      className="mb-6 flex h-9 w-full min-w-0 items-center gap-2.5 rounded-lg bg-[#f9f9f9] px-4 text-left font-normal text-[#a4a4a4] text-[14px] tracking-[-0.56px] transition-colors hover:bg-[#f3f3f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 focus-visible:outline-offset-2"
      onClick={() => {
        setOpenSearch(true);
      }}
      type="button"
    >
      <Search
        aria-hidden
        className="size-3 shrink-0 text-[#a4a4a4]"
        strokeWidth={1.5}
      />
      <span className="min-w-0 truncate">Search</span>
    </button>
  );
}
