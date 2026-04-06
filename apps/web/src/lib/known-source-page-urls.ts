import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { docsRoute } from "./shared";

const docsContentDirectory = resolve(process.cwd(), "content/docs");

const collectKnownSourcePageUrls = (
  directoryPath: string,
  parentSegments: readonly string[] = []
): string[] => {
  const pageUrls: string[] = [];
  const entries = readdirSync(directoryPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const nextSegments = [...parentSegments, entry.name];
    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      pageUrls.push(...collectKnownSourcePageUrls(entryPath, nextSegments));
      continue;
    }

    if (!(entry.isFile() && entry.name.endsWith(".mdx"))) {
      continue;
    }

    const slug = entry.name.slice(0, -".mdx".length);
    const pathnameSegments =
      slug === "index" ? parentSegments : [...parentSegments, slug];

    pageUrls.push(
      pathnameSegments.length === 0
        ? docsRoute
        : `${docsRoute}/${pathnameSegments.join("/")}`
    );
  }

  return pageUrls;
};

/** Canonical routes for component showcase pages (`app/components/[slug]`). */
const componentShowcasePageUrls = [
  "/components",
  "/components/conversation-title",
  "/components/error",
  "/components/input",
  "/components/pressable",
  "/components/recommendations",
  "/components/shell",
  "/components/sidebar",
  "/components/sources",
  "/components/loader",
] as const;

export const knownSourcePageUrls = [
  "/changelog",
  ...collectKnownSourcePageUrls(docsContentDirectory),
  ...componentShowcasePageUrls,
].sort();
