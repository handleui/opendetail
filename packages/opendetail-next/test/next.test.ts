import { buildOpenDetailIndex, type CreateOpenDetailOptions } from "opendetail";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { MAX_QUESTION_LENGTH } from "../../opendetail/src/constants";
import { OpenDetailMissingApiKeyError } from "../../opendetail/src/errors";
import type {
  OpenDetailAssistant,
  OpenDetailResponseObject,
  OpenDetailResponseStreamEvent,
} from "../../opendetail/src/types";
import {
  createFixtureWorkspace,
  removeWorkspace,
} from "../../opendetail/test/helpers";
import { createNextRoute, createNextRouteHandler } from "../src/index";
import { renderNextSourceLink } from "../src/link";

function* createMockResponseEventStream(): Generator<OpenDetailResponseStreamEvent> {
  yield {
    content_index: 0,
    delta: "Use `base_path` to prepend a route prefix [1].",
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 1,
    type: "response.output_text.delta",
  } satisfies OpenDetailResponseStreamEvent;
  yield {
    content_index: 0,
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 2,
    text: "Use `base_path` to prepend a route prefix [1].",
    type: "response.output_text.done",
  } satisfies OpenDetailResponseStreamEvent;
  yield {
    response: {
      created_at: Date.now(),
      error: null,
      id: "resp_1",
      incomplete_details: null,
      instructions: null,
      model: "gpt-5.4-mini",
      output: [],
      output_text: "Use `base_path` to prepend a route prefix [1].",
      status: "completed",
    } as unknown as OpenDetailResponseObject,
    sequence_number: 3,
    type: "response.completed",
  } satisfies OpenDetailResponseStreamEvent;
}

const createMockClient = (): NonNullable<CreateOpenDetailOptions["client"]> =>
  ({
    responses: {
      create: (request: unknown) => {
        if ((request as { stream?: boolean }).stream) {
          return Promise.resolve(createMockResponseEventStream());
        }

        return Promise.resolve({
          created_at: Date.now(),
          error: null,
          id: "resp_1",
          incomplete_details: null,
          instructions: null,
          model: "gpt-5.4-mini",
          output: [],
          output_text: "Use `base_path` to prepend a route prefix [1].",
          status: "completed",
        } as unknown as OpenDetailResponseObject);
      },
    },
  }) as NonNullable<CreateOpenDetailOptions["client"]>;

describe("createNextRouteHandler", () => {
  const createMockAssistant = (): OpenDetailAssistant => ({
    answer: () =>
      Promise.resolve({
        fallback: false,
        images: [],
        model: "gpt-5.4-mini",
        sources: [],
        text: "Ready.",
      }),
    stream: () =>
      Promise.resolve({
        fallback: false,
        images: [],
        model: "gpt-5.4-mini",
        sources: [],
        stream: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                `${JSON.stringify({
                  text: "Ready.",
                  type: "done",
                })}\n`
              )
            );
            controller.close();
          },
        }),
      }),
  });

  test("validates the request body", async () => {
    const handler = createNextRouteHandler();
    const response = await handler(
      new Request("http://localhost/api/opendetail", {
        body: JSON.stringify({ prompt: "wrong" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_request",
      error: `Request body must be valid JSON with the shape { question: string } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`,
      retryable: false,
    });
  });

  test("rejects unsupported methods", async () => {
    const handler = createNextRouteHandler();
    const response = await handler(
      new Request("http://localhost/api/opendetail", {
        method: "GET",
      })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    await expect(response.json()).resolves.toMatchObject({
      code: "method_not_allowed",
      error:
        "Method not allowed. Use POST with a JSON body shaped like { question: string }.",
      retryable: false,
    });
  });

  test("rejects oversized questions", async () => {
    const handler = createNextRouteHandler();
    const response = await handler(
      new Request("http://localhost/api/opendetail", {
        body: JSON.stringify({
          question: "x".repeat(MAX_QUESTION_LENGTH + 1),
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_request",
      error: `Request body must be valid JSON with the shape { question: string } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`,
      retryable: false,
    });
  });

  test("returns the NDJSON stream contract", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const handler = createNextRouteHandler({
        client: createMockClient(),
        indexData: artifact,
      });
      const response = await handler(
        new Request("http://localhost/api/opendetail", {
          body: JSON.stringify({
            question: "What does base_path do?",
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        })
      );
      const body = await response.text();
      const events = body
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("content-type")).toContain(
        "application/x-ndjson"
      );
      expect(events[0]).toEqual({
        model: "gpt-5.4-mini",
        type: "meta",
      });
      expect(events[1]?.type).toBe("sources");
      expect(events[2]).toEqual({
        images: [],
        type: "images",
      });
      expect(events.at(-1)).toEqual({
        text: "Use `base_path` to prepend a route prefix [1].",
        type: "done",
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("returns an actionable production error when the index is missing", async () => {
    const cwd = await createFixtureWorkspace("basic");
    vi.stubEnv("NODE_ENV", "production");

    try {
      const handler = createNextRouteHandler({ cwd });
      const response = await handler(
        new Request("http://localhost/api/opendetail", {
          body: JSON.stringify({
            question: "What does base_path do?",
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        })
      );

      expect(response.status).toBe(500);
      const payload = await response.json();

      expect(payload).toMatchObject({
        code: "missing_index",
        error: expect.stringContaining(
          "Run `npx opendetail build` before starting the production server."
        ),
        retryable: false,
      });
      expect(payload).not.toMatchObject({
        error: expect.stringContaining(cwd),
      });
    } finally {
      vi.unstubAllEnvs();
      await removeWorkspace(cwd);
    }
  });

  test("initializes the assistant only once per handler", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const openDetailModule = await import("opendetail");
      const createOpenDetailSpy = vi.spyOn(
        openDetailModule,
        "createOpenDetail"
      );
      const handler = createNextRouteHandler({
        client: createMockClient(),
        indexData: artifact,
      });

      const createRequest = () =>
        new Request("http://localhost/api/opendetail", {
          body: JSON.stringify({
            question: "What does base_path do?",
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        });

      const firstResponse = await handler(createRequest());
      const secondResponse = await handler(createRequest());

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(createOpenDetailSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
      await removeWorkspace(cwd);
    }
  });

  test("returns a typed setup error when OPENAI_API_KEY is missing", async () => {
    const cwd = await createFixtureWorkspace("basic");
    vi.stubEnv("OPENAI_API_KEY", "");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const handler = createNextRouteHandler({
        cwd,
        indexData: artifact,
      });
      const response = await handler(
        new Request("http://localhost/api/opendetail", {
          body: JSON.stringify({
            question: "What does base_path do?",
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        })
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        code: "missing_api_key",
        error: "OPENAI_API_KEY is required at runtime.",
        retryable: false,
      });
    } finally {
      vi.unstubAllEnvs();
      await removeWorkspace(cwd);
    }
  });

  test("does not cache fixable initialization errors in development", async () => {
    const cwd = await createFixtureWorkspace("basic");
    vi.stubEnv("NODE_ENV", "development");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const openDetailModule = await import("opendetail");
      const createOpenDetailSpy = vi
        .spyOn(openDetailModule, "createOpenDetail")
        .mockImplementationOnce(() => {
          throw new OpenDetailMissingApiKeyError();
        })
        .mockImplementationOnce(createMockAssistant);
      const handler = createNextRouteHandler({
        cwd,
        indexData: artifact,
      });
      const createRequest = () =>
        new Request("http://localhost/api/opendetail", {
          body: JSON.stringify({
            question: "What does base_path do?",
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        });

      const firstResponse = await handler(createRequest());
      const secondResponse = await handler(createRequest());

      expect(firstResponse.status).toBe(500);
      expect(secondResponse.status).toBe(200);
      expect(createOpenDetailSpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
      await removeWorkspace(cwd);
    }
  });
});

describe("renderNextSourceLink", () => {
  test("renders internal links with Next navigation output", () => {
    const html = renderToStaticMarkup(
      createElement(() =>
        renderNextSourceLink({
          children: "Docs",
          source: {
            title: "Docs",
            url: "/docs/guide",
          },
          target: {
            href: "/docs/guide",
          },
        })
      )
    );

    expect(html).toContain('href="/docs/guide"');
    expect(html).not.toContain('target="_blank"');
  });

  test("renders external links with noopener", () => {
    const html = renderToStaticMarkup(
      createElement(() =>
        renderNextSourceLink({
          children: "Reference",
          source: {
            kind: "remote",
            title: "Reference",
            url: "https://example.com/docs",
          },
          target: {
            external: true,
            href: "https://example.com/docs",
          },
        })
      )
    );

    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toContain('target="_blank"');
  });

  test("drops unsafe custom hrefs", () => {
    const html = renderToStaticMarkup(
      createElement(() =>
        renderNextSourceLink({
          children: "Unsafe",
          source: {
            title: "Unsafe",
            url: "/docs/unsafe",
          },
          target: {
            href: "javascript:alert(1)",
          },
        })
      )
    );

    expect(html).not.toContain("javascript:alert(1)");
    expect(html).not.toContain("<a");
  });
});

describe("createNextRoute", () => {
  test("returns POST handler and nodejs runtime", () => {
    const route = createNextRoute();

    expect(typeof route.POST).toBe("function");
    expect(route.runtime).toBe("nodejs");
  });
});
