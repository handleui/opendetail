import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { docsRoute, uiRoute } from "./shared";

const docsContentDirectory = resolve(process.cwd(), "content/docs");
const uiContentDirectory = resolve(process.cwd(), "content/ui");

const collectKnownSourcePageUrls = (
  directoryPath: string,
  baseRoute: string,
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
      pageUrls.push(
        ...collectKnownSourcePageUrls(entryPath, baseRoute, nextSegments)
      );
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
        ? baseRoute
        : `${baseRoute}/${pathnameSegments.join("/")}`
    );
  }

  return pageUrls;
};

export const knownSourcePageUrls = [
  "/changelog",
  ...collectKnownSourcePageUrls(docsContentDirectory, docsRoute),
  ...collectKnownSourcePageUrls(uiContentDirectory, uiRoute),
].sort();
