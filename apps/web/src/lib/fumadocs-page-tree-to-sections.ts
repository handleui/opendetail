import type { Folder, Node, Root } from "fumadocs-core/page-tree";

import type { SiteNavNode, SiteNavSection } from "@/lib/site-nav";

const SEPARATOR_TITLE = /^---(.+)---$/;

function normalizeHref(href: string): string {
  if (href.length > 1 && href.endsWith("/")) {
    return href.slice(0, -1);
  }
  return href;
}

function nodeName(node: { name?: unknown }): string {
  if (typeof node.name === "string") {
    return node.name;
  }
  if (
    node.name != null &&
    typeof node.name === "object" &&
    "props" in node.name
  ) {
    const p = (node.name as { props?: { children?: unknown } }).props;
    if (p?.children != null && typeof p.children === "string") {
      return p.children;
    }
  }
  return "";
}

function separatorTitle(raw: string): string {
  const m = SEPARATOR_TITLE.exec(raw.trim());
  return m?.[1]?.trim() ?? raw;
}

function folderToPageNodes(folder: Folder): SiteNavNode[] {
  const out: SiteNavNode[] = [];
  if (folder.index) {
    out.push({
      kind: "page",
      label: nodeName(folder.index),
      href: folder.index.url,
    });
  }
  for (const child of folder.children) {
    out.push(...nodeToPageNodes(child));
  }
  return out;
}

function nodeToPageNodes(node: Node): SiteNavNode[] {
  if (node.type === "page") {
    return [
      {
        kind: "page",
        label: nodeName(node),
        href: node.url,
      },
    ];
  }
  if (node.type === "folder") {
    return folderToPageNodes(node);
  }
  return [];
}

export interface PageTreeToSectionsOptions {
  /** Collection index URL (e.g. `/docs`) — omitted from the list; show separately as “Documentation”. */
  skipIndexHref: string;
}

/**
 * Maps a Fumadocs `loader.getPageTree()` root into sidebar sections.
 * `meta.json` separators (`---Title---`) become section headings; other pages fill the current section.
 */
export function pageTreeToSidebarSections(
  root: Root,
  options: PageTreeToSectionsOptions
): SiteNavSection[] {
  const skip = normalizeHref(options.skipIndexHref);
  const sections: SiteNavSection[] = [];
  let current: { title: string; items: SiteNavNode[] } = {
    title: "",
    items: [],
  };

  const pushCurrent = () => {
    if (current.title || current.items.length > 0) {
      sections.push(current);
    }
  };

  const shouldSkipPageHref = (href: string): boolean =>
    normalizeHref(href) === skip;

  for (const node of root.children) {
    if (node.type === "separator") {
      pushCurrent();
      current = {
        title: separatorTitle(nodeName(node) || "More"),
        items: [],
      };
      continue;
    }

    if (node.type === "page") {
      if (shouldSkipPageHref(node.url)) {
        continue;
      }
      current.items.push({
        kind: "page",
        label: nodeName(node),
        href: node.url,
      });
      continue;
    }

    if (node.type === "folder") {
      const nested = folderToPageNodes(node);
      for (const item of nested) {
        if (item.kind === "page" && shouldSkipPageHref(item.href)) {
          continue;
        }
        current.items.push(item);
      }
    }
  }

  pushCurrent();

  return sections;
}
