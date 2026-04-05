/**
 * Site URL ↔ sidebar nests (docs vs component gallery) — **not** Fumadocs UI; those live in
 * `apps/web`. For Fumadocs-native multi-tree patterns (verified via Context7, `/fuma-nama/fumadocs`):
 *
 * - **Multiple loaders**: separate `loader({ baseUrl: '/docs', ... })` and
 *   `loader({ baseUrl: '/components', ... })` with different `createMDXSource` collections.
 * - **Root folders**: `meta.json` with `"root": true` for tabbed sidebars; only the active
 *   root’s tree is shown.
 * - **DocsLayout `sidebar.tabs`**: tab `url` per section (e.g. Getting Started vs API).
 *
 * This file only drives **our** marketing shell sidebar; MDX content may stay one collection
 * with redirects (`/docs/components/*` → `/components/*`) until a second collection is added.
 */

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

/** Grouped docs nav — matches `content/docs`. */
export const SITE_DOCS_NAV_TREE: readonly SiteNavSection[] = [
  {
    title: "Get started",
    items: [
      { kind: "page", label: "Documentation", href: "/docs" },
      { kind: "page", label: "Quickstart", href: "/docs/quickstart" },
      { kind: "page", label: "Integration", href: "/docs/integration" },
    ],
  },
  {
    title: "OpenDetail",
    items: [
      { kind: "page", label: "Overview", href: "/docs/opendetail" },
      { kind: "page", label: "Configuration", href: "/docs/configuration" },
      { kind: "page", label: "Runtime", href: "/docs/runtime" },
    ],
  },
  {
    title: "CLI",
    items: [
      { kind: "page", label: "Overview", href: "/docs/cli" },
      { kind: "page", label: "Quickstart", href: "/docs/cli/quickstart" },
      { kind: "page", label: "Reference", href: "/docs/cli/commands" },
      { kind: "page", label: "build", href: "/docs/cli/build" },
      { kind: "page", label: "setup", href: "/docs/cli/setup" },
      { kind: "page", label: "doctor", href: "/docs/cli/doctor" },
    ],
  },
  {
    title: "Adapters",
    items: [
      { kind: "page", label: "Next.js", href: "/docs/next" },
      { kind: "page", label: "React", href: "/docs/react" },
      { kind: "page", label: "Fumadocs", href: "/docs/fumadocs" },
    ],
  },
] as const;

/** Root prefix for component gallery routes (`app/components/*`). */
export const COMPONENTS_PATH_PREFIX = "/components";

/** Index route for the gallery — shown above the "Components" group (uncategorized). */
export const SITE_COMPONENTS_OVERVIEW: { href: string; label: string } = {
  href: "/components",
  label: "Overview",
};

/** Grouped items only (Shell, Input, …) — {@link SITE_COMPONENTS_OVERVIEW} is separate in the UI. */
export const SITE_COMPONENTS_GROUP_SECTION: SiteNavSection = {
  title: "Components",
  items: [
    { kind: "page", label: "Shell", href: "/components/shell" },
    { kind: "page", label: "Input", href: "/components/input" },
    {
      kind: "page",
      label: "Recommendations",
      href: "/components/recommendations",
    },
  ],
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

/** True when pathname is the docs index or any page under the docs prefix. */
export function isUnderDocsPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  const base = normalizePath(docsPathPrefix);
  const normalized = normalizePath(pathname);
  return normalized === base || normalized.startsWith(`${base}/`);
}

/**
 * True when pathname is under the component gallery (`/components` or `/components/...`).
 * Never true for `/docs` or `/docs/...` (avoids prefix collisions and keeps bounds explicit).
 */
export function isUnderComponentsPathname(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (normalized === "/docs" || normalized.startsWith("/docs/")) {
    return false;
  }
  const base = normalizePath(COMPONENTS_PATH_PREFIX);
  return normalized === base || normalized.startsWith(`${base}/`);
}

/** Which secondary column nest matches this URL (mutually exclusive for normal paths). */
export function getSiteSecondaryNest(pathname: string): "components" | "docs" {
  return isUnderComponentsPathname(pathname) ? "components" : "docs";
}

/**
 * True when the sidebar should show the secondary panel (docs or components area).
 */
export function isUnderSiteSecondaryNavPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  return (
    isUnderDocsPathname(pathname, docsPathPrefix) ||
    isUnderComponentsPathname(pathname)
  );
}
