import { pageTreeToSidebarSections } from "@/lib/fumadocs-page-tree-to-sections";
import { uiRoute } from "@/lib/shared";
import type { SiteNavSection } from "@/lib/site-nav";
import { uiSource } from "@/lib/ui-source";

/** Server-only: Fumadocs page tree for `/ui` → nested Assistant UI panel sections. */
export function getUiSidebarSections(): SiteNavSection[] {
  return pageTreeToSidebarSections(uiSource.getPageTree(), {
    skipIndexHref: uiRoute,
  });
}
