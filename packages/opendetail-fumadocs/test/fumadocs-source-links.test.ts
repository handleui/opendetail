import { describe, expect, test } from "vitest";
import {
  createFumadocsSourceTargetResolver,
  resolveFumadocsSourceTarget,
} from "../src/index";

describe("resolveFumadocsSourceTarget", () => {
  test("resolves a known docs page and preserves the hash fragment", () => {
    expect(
      resolveFumadocsSourceTarget({
        knownPageUrls: [
          "/docs/getting-started",
          "/docs/reference/configuration",
        ],
        source: {
          kind: "local",
          title: "Configuration",
          url: "/docs/reference/configuration#base_path",
        },
      })
    ).toEqual({
      external: false,
      href: "/docs/reference/configuration#base_path",
    });
  });

  test("rejects unknown local-looking docs paths", () => {
    expect(
      resolveFumadocsSourceTarget({
        knownPageUrls: ["/docs/getting-started"],
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
      "/docs/getting-started",
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
