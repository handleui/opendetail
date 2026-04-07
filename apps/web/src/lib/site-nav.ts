/**
 * Site shell sidebar: path helpers for docs (`/docs`).
 * Nav tree comes from `getPageTree()` — see `docs-sidebar-sections`.
 */

import { docsRoute } from "@/lib/shared";

export type SiteNavNode =
  | { kind: "page"; label: string; href: string }
  | {
      kind: "folder";
      id: string;
      label: string;
      children: readonly SiteNavNode[];
    };

export interface SiteNavSection {
  items: readonly SiteNavNode[];
  title: string;
}

/** Docs collection index — top link in the Documentation nested panel. */
export const SITE_DOCS_ROUTER: { href: string; label: string } = {
  href: docsRoute,
  label: "Documentation",
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function isUnderDocsPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  const base = normalizePath(docsPathPrefix);
  const normalized = normalizePath(pathname);
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function isUnderSiteSecondaryNavPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  return isUnderDocsPathname(pathname, docsPathPrefix);
}
