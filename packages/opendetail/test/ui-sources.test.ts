import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AssistantResponse } from "../../../registry/ui/assistant-response/assistant-response";
import { AssistantSources } from "../../../registry/ui/assistant-sources/assistant-sources";

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
              url: "/docs/getting-started#install",
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
    expect(html).toContain('href="/docs/getting-started#install"');
    expect(html).toContain(
      'href="https://platform.openai.com/docs/api-reference/responses"'
    );
    expect(html).toContain('target="_blank"');
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
            url: "/docs/reference/configuration",
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
    expect(html).toContain('href="/docs/reference/configuration"');
    expect(html).toContain('href="https://fumadocs.dev/docs/ui/mdx"');
    expect(html).not.toContain("vector-store-file://file_123");
    expect(html).toContain("[1]");
    expect(html).toContain("[2]");
    expect(html).toContain("[3]");
  });
});
