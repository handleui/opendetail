import { describe, expect, test } from "vitest";
import {
  createFumadocsSourceTargetResolver,
  resolveFumadocsSourceTarget,
} from "../src/index";

describe("resolveFumadocsSourceTarget", () => {
  test("resolves a known docs page and preserves the hash fragment", () => {
    expect(
      resolveFumadocsSourceTarget({
        knownPageUrls: ["/docs/guide", "/docs/reference"],
        source: {
          kind: "local",
          title: "Configuration",
          url: "/docs/reference#base-path",
        },
      })
    ).toEqual({
      external: false,
      href: "/docs/reference#base-path",
    });
  });

  test("rejects unknown local-looking docs paths", () => {
    expect(
      resolveFumadocsSourceTarget({
        knownPageUrls: ["/docs/guide"],
        source: {
          kind: "local",
          title: "Unknown",
          url: "/docs/unknown-page#details",
        },
      })
    ).toBeNull();
  });

  test("keeps supported remote urls clickable", () => {
    const resolveSourceTarget = createFumadocsSourceTargetResolver([
      "/docs/guide",
    ]);

    expect(
      resolveSourceTarget({
        kind: "remote",
        title: "Responses API",
        url: "https://platform.openai.com/docs/api-reference/responses",
      })
    ).toEqual({
      external: true,
      href: "https://platform.openai.com/docs/api-reference/responses",
    });
  });
});
