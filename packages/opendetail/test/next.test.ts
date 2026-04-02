import type OpenAI from "openai";
import type {
  Response,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { describe, expect, test, vi } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { MAX_QUESTION_LENGTH } from "../src/constants";
import { createNextRouteHandler } from "../src/next";
import { createFixtureWorkspace, removeWorkspace } from "./helpers";

function* createMockResponseEventStream(): Generator<ResponseStreamEvent> {
  yield {
    content_index: 0,
    delta: "Use `base_path` to prepend a route prefix [1].",
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 1,
    type: "response.output_text.delta",
  } satisfies ResponseStreamEvent;
  yield {
    content_index: 0,
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 2,
    text: "Use `base_path` to prepend a route prefix [1].",
    type: "response.output_text.done",
  } satisfies ResponseStreamEvent;
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
    } as unknown as Response,
    sequence_number: 3,
    type: "response.completed",
  } satisfies ResponseStreamEvent;
}

const createMockClient = (): OpenAI =>
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
        } as unknown as Response);
      },
    },
  }) as OpenAI;

describe("createNextRouteHandler", () => {
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
    await expect(response.json()).resolves.toEqual({
      error: `Request body must be valid JSON with the shape { question: string } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`,
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
    await expect(response.json()).resolves.toEqual({
      error:
        "Method not allowed. Use POST with a JSON body shaped like { question: string }.",
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
    await expect(response.json()).resolves.toEqual({
      error: `Request body must be valid JSON with the shape { question: string } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`,
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
        error: expect.stringContaining(
          "Run `npx opendetail build` before starting the production server."
        ),
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
      const runtimeModule = await import("../src/runtime");
      const createOpenDetailSpy = vi.spyOn(runtimeModule, "createOpenDetail");
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
});
