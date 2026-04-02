import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type OpenAI from "openai";
import type {
  Response,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { describe, expect, test, vi } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { DEFAULT_FALLBACK_TEXT } from "../src/constants";
import { OpenDetailMissingApiKeyError } from "../src/errors";
import { createOpenDetail } from "../src/runtime";
import {
  createMiniSearchIndex,
  parseOpenDetailIndexArtifact,
  retrieveRelevantChunks,
} from "../src/search";
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

  test("ranks relevant chunks with image alt and title metadata", async () => {
    const cwd = await createFixtureWorkspace("media");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const miniSearch = createMiniSearchIndex(artifact.chunks);
      const chunks = retrieveRelevantChunks(
        miniSearch,
        "workflow widget diagram"
      );

      expect(chunks[0]?.url).toBe("/docs/visual-guide#referenced-media");
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
        cwd,
        indexData: artifact,
      });
      const result = await assistant.answer({
        question: "abracadabra glorp zizzle",
      });

      expect(result.text).toBe(DEFAULT_FALLBACK_TEXT);
      expect(result.fallback).toBe(true);
      expect(result.images).toEqual([]);
      expect(create).not.toHaveBeenCalled();
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("fails fast when OPENAI_API_KEY is missing and no client is injected", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const previousApiKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });

      expect(() =>
        createOpenDetail({
          indexData: artifact,
        })
      ).toThrowError(OpenDetailMissingApiKeyError);
    } finally {
      if (previousApiKey === undefined) {
        process.env.OPENAI_API_KEY = undefined;
      } else {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
      await removeWorkspace(cwd);
    }
  });

  test("returns relevant images alongside the text answer", async () => {
    const cwd = await createFixtureWorkspace("media");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });
      const result = await assistant.answer({
        question: "Show me the workflow widget diagram",
      });

      expect(result.fallback).toBe(false);
      expect(result.images).toEqual([
        {
          alt: "Hero diagram",
          sourceIds: ["1"],
          title: "Hero Diagram",
          url: "/content-media/hero.png",
        },
        {
          alt: "Workflow widget diagram",
          sourceIds: ["1"],
          title: "Widget Diagram",
          url: "/content-media/widget.png",
        },
        {
          alt: "Root relative diagram",
          sourceIds: ["1"],
          title: "Root Diagram",
          url: "/images/root-diagram.png",
        },
      ]);
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        input: expect.stringContaining("alt: Workflow widget diagram"),
      });
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        input: expect.not.stringContaining("/content-media/widget.png"),
      });
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        prompt_cache_key: expect.any(String),
        prompt_cache_retention: "in-memory",
      });
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
        cwd,
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
        images: [],
        type: "images",
      });
      expect(events[3]).toEqual({
        text: "Install `opendetail` ",
        type: "delta",
      });
      expect(events[4]).toEqual({
        text: "with `npm i opendetail` [1].",
        type: "delta",
      });
      expect(events[5]).toEqual({
        text: "Install `opendetail` with `npm i opendetail` [1].",
        type: "done",
      });
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        model: "gpt-5.4-mini",
        prompt_cache_key: expect.any(String),
        prompt_cache_retention: "in-memory",
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

  test("emits images before text deltas in the stream contract", async () => {
    const cwd = await createFixtureWorkspace("media");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const assistant = createOpenDetail({
        client: createMockClient().client,
        indexData: artifact,
      });
      const result = await assistant.stream({
        question: "Show me the workflow widget diagram",
      });
      const events = await readNdjsonEvents(result.stream);

      expect(result.images).toEqual([
        {
          alt: "Hero diagram",
          sourceIds: ["1"],
          title: "Hero Diagram",
          url: "/content-media/hero.png",
        },
        {
          alt: "Workflow widget diagram",
          sourceIds: ["1"],
          title: "Widget Diagram",
          url: "/content-media/widget.png",
        },
        {
          alt: "Root relative diagram",
          sourceIds: ["1"],
          title: "Root Diagram",
          url: "/images/root-diagram.png",
        },
      ]);
      expect(events[2]).toEqual({
        images: result.images,
        type: "images",
      });
      expect(events[3]?.type).toBe("delta");
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
      expect(events[1]?.type).toBe("sources");
      expect(events[2]).toEqual({
        images: [],
        type: "images",
      });
      expect(events.at(-1)).toEqual({
        code: "model_incomplete",
        message:
          "The model could not complete the answer because the response was filtered.",
        retryable: false,
        type: "error",
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("loads older index artifacts that do not include chunk images", () => {
    const artifact = parseOpenDetailIndexArtifact({
      chunks: [
        {
          anchor: null,
          filePath: "/tmp/guide.md",
          headings: ["Guide"],
          id: "guide.md",
          relativePath: "guide.md",
          text: "Guide body",
          title: "Guide",
          url: "/docs/guide",
        },
      ],
      config: {
        base_path: "/docs",
        exclude: [],
        include: ["content/**/*.md"],
        version: 1,
      },
      generatedAt: new Date().toISOString(),
      manifestHash: "hash",
      version: 1,
    });

    expect(artifact.chunks[0]?.images).toEqual([]);
  });

  test("loads custom instructions from .opendetail/OPENDETAIL.md by default", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const instructionsDirectory = path.join(cwd, ".opendetail");

      await mkdir(instructionsDirectory, { recursive: true });
      await writeFile(
        path.join(instructionsDirectory, "OPENDETAIL.md"),
        "Prefer direct, concise answers with references."
      );

      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });

      await assistant.answer({
        question: "How do I set base_path?",
      });

      expect(create.mock.calls[0]?.[0]).toMatchObject({
        instructions: expect.stringContaining(
          "Prefer direct, concise answers with references."
        ),
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("falls back to root OPENDETAIL.md when the .opendetail file is missing", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();

      await writeFile(
        path.join(cwd, "OPENDETAIL.md"),
        "Use numbered lists for setup walkthroughs."
      );

      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });

      await assistant.answer({
        question: "How do I install opendetail?",
      });

      expect(create.mock.calls[0]?.[0]).toMatchObject({
        instructions: expect.stringContaining(
          "Use numbered lists for setup walkthroughs."
        ),
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
