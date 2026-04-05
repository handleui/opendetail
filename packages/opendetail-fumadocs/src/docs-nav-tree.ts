export type DocsNavNode =
  | { kind: "page"; label: string; href: string }
  | {
      kind: "folder";
      id: string;
      label: string;
      children: readonly DocsNavNode[];
    };

export interface DocsNavSection {
  items: readonly DocsNavNode[];
  title: string;
}

/** Grouped docs nav — matches content/docs. */
export const FUMADOCS_DOCS_NAV_TREE: readonly DocsNavSection[] = [
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
      {
        kind: "folder",
        id: "cli",
        label: "CLI",
        children: [
          { kind: "page", label: "Overview", href: "/docs/cli" },
          { kind: "page", label: "Quickstart", href: "/docs/cli/quickstart" },
          { kind: "page", label: "Reference", href: "/docs/cli/commands" },
          { kind: "page", label: "build", href: "/docs/cli/build" },
          { kind: "page", label: "setup", href: "/docs/cli/setup" },
          { kind: "page", label: "doctor", href: "/docs/cli/doctor" },
        ],
      },
      { kind: "page", label: "Runtime", href: "/docs/runtime" },
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

/**
 * CLI drill-in panel: overview-style pages vs command pages (single extra nesting level).
 */
export const FUMADOCS_CLI_NAV_SECTIONS: readonly DocsNavSection[] = [
  {
    title: "Overview",
    items: [
      { kind: "page", label: "Overview", href: "/docs/cli" },
      { kind: "page", label: "Quickstart", href: "/docs/cli/quickstart" },
      { kind: "page", label: "Reference", href: "/docs/cli/commands" },
    ],
  },
  {
    title: "Commands",
    items: [
      { kind: "page", label: "build", href: "/docs/cli/build" },
      { kind: "page", label: "setup", href: "/docs/cli/setup" },
      { kind: "page", label: "doctor", href: "/docs/cli/doctor" },
    ],
  },
] as const;

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function findPageFolderIds(
  nodes: readonly DocsNavNode[],
  pathname: string,
  parents: readonly string[]
): readonly string[] | null {
  for (const node of nodes) {
    if (node.kind === "page" && node.href === pathname) {
      return parents;
    }
    if (node.kind === "folder") {
      const found = findPageFolderIds(node.children, pathname, [
        ...parents,
        node.id,
      ]);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function findPageFolderIdsInTree(
  sections: readonly DocsNavSection[],
  pathname: string
): readonly string[] {
  for (const section of sections) {
    const ids = findPageFolderIds(section.items, pathname, []);
    if (ids) {
      return ids;
    }
  }
  return [];
}

/**
 * Folder ids from root → open folder for the current docs URL (at most one level today: `cli`).
 */
export function deriveDocsFolderStack(
  pathname: string,
  docsPathPrefix: string,
  tree: readonly DocsNavSection[]
): string[] {
  const base = normalizePath(docsPathPrefix);
  const normalized = normalizePath(pathname);
  if (normalized !== base && !normalized.startsWith(`${base}/`)) {
    return [];
  }
  return [...findPageFolderIdsInTree(tree, normalized)];
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

/** True when the URL should show the CLI slide (second inner panel). */
export function isCliDocsPathname(
  pathname: string,
  docsPathPrefix: string
): boolean {
  const base = normalizePath(docsPathPrefix);
  const normalized = normalizePath(pathname);
  return normalized === `${base}/cli` || normalized.startsWith(`${base}/cli/`);
}

/**
 * Parent docs URL for sidebar Back, or `null` when Back should leave the docs panel for the site root.
 */
export function getDocsParentPath(
  pathname: string,
  docsPathPrefix: string
): string | null {
  const normalized = normalizePath(pathname);
  const base = normalizePath(docsPathPrefix);

  if (normalized === base || normalized === `${base}/`) {
    return null;
  }

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return null;
  }

  parts.pop();
  return `/${parts.join("/")}`;
}
