import { pageTreeToSidebarSections } from "@/lib/fumadocs-page-tree-to-sections";
import type { SiteNavSection } from "@/lib/site-nav";
import { source } from "@/lib/source";

/** Server-only: Fumadocs page tree for `/docs` → nested Docs panel sections. */
export function getDocsSidebarSections(): SiteNavSection[] {
  return pageTreeToSidebarSections(source.getPageTree());
}
