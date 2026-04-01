import type OpenAI from "openai";
import type {
  Response,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { describe, expect, test, vi } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { DEFAULT_FALLBACK_TEXT } from "../src/constants";
import { createOpenDetail } from "../src/runtime";
import { createMiniSearchIndex, retrieveRelevantChunks } from "../src/search";
import {
  createFixtureWorkspace,
  readNdjsonEvents,
  removeWorkspace,
} from "./helpers";

function* createMockResponseEventStream(): Generator<ResponseStreamEvent> {
  yield {
    content_index: 0,
    delta: "Install `opendetail` ",
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 1,
    type: "response.output_text.delta",
  } satisfies ResponseStreamEvent;
  yield {
    content_index: 0,
    delta: "with `npm i opendetail` [1].",
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 2,
    type: "response.output_text.delta",
  } satisfies ResponseStreamEvent;
  yield {
    content_index: 0,
    item_id: "msg_1",
    logprobs: [],
    output_index: 0,
    sequence_number: 3,
    text: "Install `opendetail` with `npm i opendetail` [1].",
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
      output_text: "Install `opendetail` with `npm i opendetail` [1].",
      status: "completed",
    } as unknown as Response,
    sequence_number: 4,
    type: "response.completed",
  } satisfies ResponseStreamEvent;
}

const createMockClient = () => {
  const create = vi.fn((request: unknown) => {
    const maybeStreamRequest = request as { stream?: boolean };

    if (maybeStreamRequest.stream) {
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
  });

  return {
    client: {
      responses: {
        create,
      },
    } as unknown as OpenAI,
    create,
  };
};

describe("OpenDetail runtime", () => {
  test("ranks relevant chunks with MiniSearch", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const miniSearch = createMiniSearchIndex(artifact.chunks);
      const chunks = retrieveRelevantChunks(
        miniSearch,
        "How do I set base_path for generated URLs?"
      );

      expect(chunks[0]?.url).toBe("/docs/configuration#base_path");
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("returns the fixed fallback without calling OpenAI when nothing matches", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const assistant = createOpenDetail({
        client,
        indexData: artifact,
      });
      const result = await assistant.answer({
        question: "abracadabra glorp zizzle",
      });

      expect(result.text).toBe(DEFAULT_FALLBACK_TEXT);
      expect(result.fallback).toBe(true);
      expect(create).not.toHaveBeenCalled();
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("streams NDJSON events from a mocked OpenAI response stream", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const assistant = createOpenDetail({
        client,
        indexData: artifact,
      });
      const result = await assistant.stream({
        question: "How do I install opendetail?",
      });
      const events = await readNdjsonEvents(result.stream);

      expect(events[0]).toEqual({
        model: "gpt-5.4-mini",
        type: "meta",
      });
      expect(events[1]?.type).toBe("sources");
      expect(events[2]).toEqual({
        text: "Install `opendetail` ",
        type: "delta",
      });
      expect(events[3]).toEqual({
        text: "with `npm i opendetail` [1].",
        type: "delta",
      });
      expect(events[4]).toEqual({
        text: "Install `opendetail` with `npm i opendetail` [1].",
        type: "done",
      });
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        model: "gpt-5.4-mini",
        reasoning: {
          effort: "none",
        },
        store: false,
        stream: true,
        text: {
          verbosity: "low",
        },
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("surfaces incomplete non-streaming responses as errors", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const assistant = createOpenDetail({
        client: {
          responses: {
            create: () =>
              Promise.resolve({
                created_at: Date.now(),
                error: null,
                id: "resp_incomplete",
                incomplete_details: {
                  reason: "max_output_tokens",
                },
                instructions: null,
                model: "gpt-5.4-mini",
                output: [],
                output_text: "",
                status: "incomplete",
              } as unknown as Response),
          },
        } as unknown as OpenAI,
        indexData: artifact,
      });

      await expect(
        assistant.answer({
          question: "How do I install opendetail?",
        })
      ).rejects.toThrow(
        "The model could not complete the answer before reaching the output token limit."
      );
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("emits an error event for incomplete streaming responses", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const assistant = createOpenDetail({
        client: {
          responses: {
            create: () =>
              Promise.resolve(
                (function* (): Generator<ResponseStreamEvent> {
                  yield {
                    response: {
                      created_at: Date.now(),
                      error: null,
                      id: "resp_incomplete",
                      incomplete_details: {
                        reason: "content_filter",
                      },
                      instructions: null,
                      model: "gpt-5.4-mini",
                      output: [],
                      output_text: "",
                      status: "incomplete",
                    } as unknown as Response,
                    sequence_number: 1,
                    type: "response.incomplete",
                  } satisfies ResponseStreamEvent;
                })()
              ),
          },
        } as unknown as OpenAI,
        indexData: artifact,
      });
      const result = await assistant.stream({
        question: "How do I install opendetail?",
      });
      const events = await readNdjsonEvents(result.stream);

      expect(events[0]).toEqual({
        model: "gpt-5.4-mini",
        type: "meta",
      });
      expect(events.at(-1)).toEqual({
        message:
          "The model could not complete the answer because the response was filtered.",
        type: "error",
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
