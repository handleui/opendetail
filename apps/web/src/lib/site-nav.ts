/**
 * Site shell sidebar: path helpers for docs (`/docs`) and the UI sandbox (`/ui`).
 * Nav trees come from `getPageTree()` — see `docs-sidebar-sections` / `ui-sidebar-sections`.
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

/** Canonical path prefix for Assistant UI docs + previews. */
export const UI_DOCS_PATH_PREFIX = "/ui";

/** Assistant UI — top link in the nested panel (UI sandbox). */
export const SITE_UI_DOCS_ROUTER: { href: string; label: string } = {
  href: "/ui",
  label: "UI sandbox",
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

export function isUnderUiDocsPathname(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (normalized === "/docs" || normalized.startsWith("/docs/")) {
    return false;
  }
  const base = normalizePath(UI_DOCS_PATH_PREFIX);
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function getSiteSecondaryNest(pathname: string): "ui" | "docs" {
  return isUnderUiDocsPathname(pathname) ? "ui" : "docs";
}

export function isUnderSiteSecondaryNavPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  return (
    isUnderDocsPathname(pathname, docsPathPrefix) ||
    isUnderUiDocsPathname(pathname)
  );
}
