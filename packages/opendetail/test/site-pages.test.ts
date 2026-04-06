import { describe, expect, test } from "vitest";
import {
  filterChunkIdsBySitePaths,
  getUrlPathname,
  normalizeSitePathInput,
  pathMatchesSitePrefix,
} from "../src/site-pages";
import type { OpenDetailChunk } from "../src/types";

describe("site path helpers", () => {
  test("getUrlPathname strips hash for root-relative URLs", () => {
    expect(getUrlPathname("/docs/foo#bar")).toBe("/docs/foo");
  });

  test("pathMatchesSitePrefix treats / as home only", () => {
    expect(pathMatchesSitePrefix("/", "/")).toBe(true);
    expect(pathMatchesSitePrefix("/pricing", "/")).toBe(false);
  });

  test("pathMatchesSitePrefix matches prefixes", () => {
    expect(pathMatchesSitePrefix("/docs/foo", "/docs")).toBe(true);
    expect(pathMatchesSitePrefix("/docs", "/docs")).toBe(true);
  });

  test("normalizeSitePathInput rejects path traversal", () => {
    expect(normalizeSitePathInput("/../etc")).toBe(null);
  });

  test("filterChunkIdsBySitePaths filters by sitePaths", () => {
    const chunks: OpenDetailChunk[] = [
      {
        anchor: null,
        filePath: "/x/a.mdx",
        headings: [],
        id: "a",
        relativePath: "a.mdx",
        text: "t",
        title: "A",
        url: "/marketing",
      },
      {
        anchor: null,
        filePath: "/x/b.mdx",
        headings: [],
        id: "b",
        relativePath: "b.mdx",
        text: "t",
        title: "B",
        url: "/docs/foo",
      },
    ];

    const ids = filterChunkIdsBySitePaths(chunks, ["/docs"]);

    expect([...ids]).toEqual(["b"]);
  });
});
