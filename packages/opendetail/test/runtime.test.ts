import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type OpenAI from "openai";
import type {
  Response,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { describe, expect, test, vi } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { OPENDETAIL_CONVERSATION_TITLE_INSTRUCTIONS_MARKER } from "../src/constants";
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

function* createUndocumentedResponseEventStream(
  text: string
): Generator<ResponseStreamEvent> {
  yield {
    content_index: 0,
    delta: text,
    item_id: "msg_missing_docs",
    logprobs: [],
    output_index: 0,
    sequence_number: 1,
    type: "response.output_text.delta",
  } satisfies ResponseStreamEvent;
  yield {
    content_index: 0,
    item_id: "msg_missing_docs",
    logprobs: [],
    output_index: 0,
    sequence_number: 2,
    text,
    type: "response.output_text.done",
  } satisfies ResponseStreamEvent;
  yield {
    response: {
      created_at: Date.now(),
      error: null,
      id: "resp_missing_docs",
      incomplete_details: null,
      instructions: null,
      model: "gpt-5.4-mini",
      output: [],
      output_text: text,
      status: "completed",
    } as unknown as Response,
    sequence_number: 3,
    type: "response.completed",
  } satisfies ResponseStreamEvent;
}

const createMockClient = () => {
  const create = vi.fn((request: unknown) => {
    const maybeStreamRequest = request as {
      instructions?: string;
      stream?: boolean;
    };

    if (maybeStreamRequest.stream) {
      return Promise.resolve(createMockResponseEventStream());
    }

    if (
      typeof maybeStreamRequest.instructions === "string" &&
      maybeStreamRequest.instructions.includes(
        OPENDETAIL_CONVERSATION_TITLE_INSTRUCTIONS_MARKER
      )
    ) {
      return Promise.resolve({
        created_at: Date.now(),
        error: null,
        id: "resp_title",
        incomplete_details: null,
        instructions: null,
        model: "gpt-5.4-mini",
        output: [],
        output_text: "Installing OpenDetail package",
        status: "completed",
      } as unknown as Response);
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

const createMissingDocsMockClient = (text: string) => {
  const create = vi.fn((request: unknown) => {
    const maybeStreamRequest = request as { stream?: boolean };

    if (maybeStreamRequest.stream) {
      return Promise.resolve(createUndocumentedResponseEventStream(text));
    }

    return Promise.resolve({
      created_at: Date.now(),
      error: null,
      id: "resp_missing_docs",
      incomplete_details: null,
      instructions: null,
      model: "gpt-5.4-mini",
      output: [],
      output_text: text,
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

  test("asks the model for a short answer when no indexed sources match", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const missingSourcesText =
      "I couldn't find that described in the available sources yet.";

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } =
        createMissingDocsMockClient(missingSourcesText);
      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });
      const result = await assistant.answer({
        question: "abracadabra glorp zizzle",
      });

      expect(result.text).toBe(missingSourcesText);
      expect(result.fallback).toBe(true);
      expect(result.images).toEqual([]);
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        input: expect.stringContaining("Indexed source matches:\nno"),
      });
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        instructions: expect.stringContaining(
          'Do not use canned wording that claims you searched "the configured docs"'
        ),
      });
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
      const firstRequest = create.mock.calls[0]?.[0] as { input: string };

      expect(firstRequest.input.includes("alt: Workflow widget diagram")).toBe(
        true
      );
      expect(firstRequest.input.includes("/content-media/widget.png")).toBe(
        false
      );
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        prompt_cache_key: expect.any(String),
        prompt_cache_retention: "in_memory",
      });
      expect(firstRequest.input.startsWith("Sources:\n")).toBe(true);
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
        prompt_cache_retention: "in_memory",
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

  test("streams a conversation title when conversationTitle is true", async () => {
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
        conversationTitle: true,
        question: "How do I install opendetail?",
      });
      const events = await readNdjsonEvents(result.stream);

      const titleEvent = events.find(
        (event): event is { title: string; type: "title" } =>
          event.type === "title"
      );

      expect(titleEvent).toEqual({
        title: "Installing OpenDetail package",
        type: "title",
      });
      expect(create).toHaveBeenCalledTimes(2);
      expect(events.at(-1)).toEqual({
        text: "Install `opendetail` with `npm i opendetail` [1].",
        type: "done",
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("streams a short answer when no indexed sources match", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const missingSourcesText =
      "I couldn't find that described in the available sources yet.";

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } =
        createMissingDocsMockClient(missingSourcesText);
      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });
      const result = await assistant.stream({
        question: "abracadabra glorp zizzle",
      });
      const events = await readNdjsonEvents(result.stream);

      expect(result.fallback).toBe(true);
      expect(events[0]).toEqual({
        model: "gpt-5.4-mini",
        type: "meta",
      });
      expect(events[1]).toEqual({
        sources: [],
        type: "sources",
      });
      expect(events[2]).toEqual({
        images: [],
        type: "images",
      });
      expect(events[3]).toEqual({
        text: missingSourcesText,
        type: "delta",
      });
      expect(events[4]).toEqual({
        text: missingSourcesText,
        type: "done",
      });
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0]?.[0]).toMatchObject({
        input: expect.stringContaining("Indexed source matches:\nno"),
        stream: true,
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

  test("adds remote sources from response annotations when remote resources are configured", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const create = vi.fn((_request: unknown) =>
        Promise.resolve({
          created_at: Date.now(),
          error: null,
          id: "resp_with_remote_sources",
          incomplete_details: null,
          instructions: null,
          model: "gpt-5.4-mini",
          output: [
            {
              content: [
                {
                  annotations: [
                    {
                      end_index: 24,
                      start_index: 1,
                      title: "OpenAI Responses API",
                      type: "url_citation",
                      url: "https://platform.openai.com/docs/api-reference/responses",
                    },
                  ],
                  text: "Use the Responses API docs [1].",
                  type: "output_text",
                },
              ],
              id: "msg_1",
              role: "assistant",
              status: "completed",
              type: "message",
            },
          ],
          output_text: "Use the Responses API docs [1].",
          status: "completed",
        } as unknown as Response)
      );
      const assistant = createOpenDetail({
        client: {
          responses: {
            create,
          },
        } as unknown as OpenAI,
        indexData: artifact,
        remoteResources: {
          web_search: {
            allowed_domains: ["platform.openai.com"],
            search_context_size: "low",
          },
        },
      });
      const result = await assistant.answer({
        question: "How can I use remote docs?",
      });

      expect(create).toHaveBeenCalledTimes(1);
      expect(
        create.mock.calls[0]?.[0] as unknown as Record<string, unknown>
      ).toMatchObject({
        include: expect.arrayContaining(["web_search_call.action.sources"]),
        tools: [
          {
            filters: {
              allowed_domains: ["platform.openai.com"],
            },
            search_context_size: "low",
            type: "web_search",
          },
        ],
      });
      expect(result.sources.some((source) => source.kind === "remote")).toBe(
        true
      );
      expect(result.sources.at(-1)).toMatchObject({
        kind: "remote",
        title: "OpenAI Responses API",
        url: "https://platform.openai.com/docs/api-reference/responses",
      });
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
      expect(events.at(-1)).toMatchObject({
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
          filePath: "/tmp/quickstart.md",
          headings: ["Quickstart"],
          id: "quickstart.md",
          relativePath: "quickstart.md",
          text: "Quickstart body",
          title: "Quickstart",
          url: "/docs/quickstart",
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

  test("labels inline assistantInstructions correctly in the model instructions", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const assistant = createOpenDetail({
        assistantInstructions: "Answer with terse steps.",
        client,
        indexData: artifact,
      });

      await assistant.answer({
        question: "How do I install opendetail?",
      });

      expect(create.mock.calls[0]?.[0]).toMatchObject({
        instructions: expect.stringContaining(
          "Project-specific instructions loaded from assistantInstructions option:"
        ),
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("uses distinct auto-generated prompt cache keys for different questions", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const { client, create } = createMockClient();
      const assistant = createOpenDetail({
        client,
        cwd,
        indexData: artifact,
      });

      await assistant.answer({
        question: "How do I install opendetail?",
      });
      await assistant.answer({
        question: "How do I install opendetail on a new app?",
      });

      const firstRequest = create.mock.calls[0]?.[0] as
        | { prompt_cache_key?: string }
        | undefined;
      const secondRequest = create.mock.calls[1]?.[0] as
        | { prompt_cache_key?: string }
        | undefined;

      expect(firstRequest).toMatchObject({
        prompt_cache_key: expect.any(String),
      });
      expect(secondRequest).toMatchObject({
        prompt_cache_key: expect.any(String),
      });
      expect(firstRequest).not.toMatchObject({
        prompt_cache_key: secondRequest?.prompt_cache_key,
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
