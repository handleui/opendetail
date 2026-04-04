import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import {
  AssistantResponse,
  AssistantSources,
  getSourcesCitedInContent,
  renderAssistantSourceLink,
} from "../src/index";

describe("assistant source rendering", () => {
  test("renders clickable local and remote inline citations", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          sources: [
            {
              id: "1",
              kind: "local",
              title: "Getting Started",
              url: "/docs/guide#install",
            },
            {
              id: "2",
              kind: "remote",
              title: "Responses API",
              url: "https://platform.openai.com/docs/api-reference/responses",
            },
          ],
        },
        "Read this [1] and compare it with [2]."
      )
    );

    expect(html).toContain('class="opendetail-citation-link"');
    expect(html).toContain('href="/docs/guide#install"');
    expect(html).toContain(
      'href="https://platform.openai.com/docs/api-reference/responses"'
    );
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toContain('target="_blank"');
  });

  test("does not load third-party favicon urls for remote citations", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          sources: [
            {
              id: "1",
              kind: "remote",
              title: "Responses API",
              url: "https://platform.openai.com/docs/api-reference/responses",
            },
          ],
        },
        "Remote citation [1]."
      )
    );

    expect(html).not.toContain("google.com/s2/favicons");
    expect(html).not.toContain("opendetail-citation-marker__favicon");
  });

  test("keeps unsupported inline citations non-clickable", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          sources: [
            {
              id: "1",
              kind: "remote",
              title: "Vector Store File",
              url: "vector-store-file://file_123",
            },
          ],
        },
        "This should stay plain [1]."
      )
    );

    expect(html).not.toContain("vector-store-file://file_123");
    expect(html).not.toContain('class="opendetail-citation-link"');
    expect(html).toContain('title="Citation 1: Vector Store File"');
  });

  test("does not crash when a citation has no matching source", () => {
    const html = renderToStaticMarkup(
      createElement(AssistantResponse, null, "Missing source [3].")
    );

    expect(html).toContain('title="Citation 3"');
  });

  test("renders expandable sources with matching link behavior", () => {
    const html = renderToStaticMarkup(
      createElement(AssistantSources, {
        defaultOpen: true,
        items: [
          {
            id: "1",
            kind: "local",
            title: "Configuration",
            url: "/docs/reference#configuration",
          },
          {
            id: "2",
            kind: "remote",
            title: "Fumadocs",
            url: "https://fumadocs.dev/docs/ui/mdx",
          },
          {
            id: "3",
            kind: "remote",
            title: "Vector Store File",
            url: "vector-store-file://file_123",
          },
        ],
      })
    );

    expect(html).toContain(">3 sources<");
    expect(html).toContain("opendetail-sources__pills");
    expect(html).toContain('href="/docs/reference#configuration"');
    expect(html).toContain('href="https://fumadocs.dev/docs/ui/mdx"');
    expect(html).not.toContain("vector-store-file://file_123");
    expect(html).toContain("Configuration");
    expect(html).toContain("Fumadocs");
    expect(html).toContain("Vector Store File");
    expect(html).toContain("opendetail-sources__pill-favicon");
    expect(html).toContain("google.com/s2/favicons");
    expect(html).toContain("fumadocs.dev");
  });

  test("lists only sources cited in the response body", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          defaultSourcesOpen: true,
          sources: [
            { id: "1", kind: "local", title: "Alpha", url: "/a" },
            { id: "2", kind: "local", title: "Beta", url: "/b" },
            { id: "3", kind: "local", title: "Gamma", url: "/c" },
          ],
        },
        "See [1] only."
      )
    );

    expect(html).toContain(">1 source<");
    expect(html).toContain('href="/a"');
    expect(html).not.toContain('href="/b"');
    expect(html).not.toContain('href="/c"');
  });

  test("omits sources footer when the response cites no sources", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          sources: [{ id: "1", kind: "local", title: "Alpha", url: "/a" }],
        },
        "No numeric citations in this answer."
      )
    );

    expect(html).not.toContain("opendetail-sources__toggle");
  });

  test("getSourcesCitedInContent dedupes and orders by first citation", () => {
    const sources = [
      { id: "1", kind: "local" as const, title: "A", url: "/a" },
      { id: "2", kind: "local" as const, title: "B", url: "/b" },
    ];

    expect(
      getSourcesCitedInContent({
        children: "[2] then [1] again [2]",
        sources,
      }).map((s) => s.title)
    ).toEqual(["B", "A"]);
  });

  test("drops unsafe custom source hrefs", () => {
    const html = renderToStaticMarkup(
      createElement(
        AssistantResponse,
        {
          renderSourceLink: (props) => renderAssistantSourceLink(props),
          resolveSourceTarget: () => ({
            href: "javascript:alert(1)",
          }),
          sources: [
            {
              id: "1",
              kind: "local",
              title: "Unsafe",
              url: "/docs/unsafe",
            },
          ],
        },
        "Unsafe [1]."
      )
    );

    expect(html).not.toContain("javascript:alert(1)");
    expect(html).not.toContain('<a class="opendetail-citation-link"');
  });
});
