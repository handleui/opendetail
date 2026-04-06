import { describe, expect, test } from "vitest";
import {
  decodeBasicHtmlEntities,
  filterChunkIdsBySitePaths,
  getUrlPathname,
  isPathAllowedForFetch,
  normalizeSitePathInput,
  pathMatchesAllowedFetchPrefix,
  pathMatchesSitePrefix,
  stripHtmlToText,
} from "../src/site-pages";
import type { OpenDetailChunk } from "../src/types";

describe("site-pages path helpers", () => {
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

  test("pathMatchesAllowedFetchPrefix allows entire site when prefix is /", () => {
    expect(pathMatchesAllowedFetchPrefix("/anything", "/")).toBe(true);
  });

  test("normalizeSitePathInput rejects path traversal", () => {
    expect(normalizeSitePathInput("/../etc")).toBe(null);
  });

  test("isPathAllowedForFetch respects allowlist", () => {
    expect(
      isPathAllowedForFetch("/pricing", {
        allowed_path_prefixes: ["/pricing"],
      })
    ).toBe(true);
    expect(
      isPathAllowedForFetch("/admin", {
        allowed_path_prefixes: ["/pricing"],
      })
    ).toBe(false);
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

describe("stripHtmlToText", () => {
  test("removes scripts and exposes body text", () => {
    const { text, title } = stripHtmlToText(
      "<!DOCTYPE html><html><head><title>Hi</title><script>evil()</script></head><body><p>Hello</p></body></html>"
    );

    expect(title).toBe("Hi");
    expect(text).toContain("Hello");
    expect(text.includes("evil")).toBe(false);
  });
});

describe("decodeBasicHtmlEntities", () => {
  test("decodes common entities", () => {
    expect(decodeBasicHtmlEntities("a &amp; b")).toBe("a & b");
  });
});
