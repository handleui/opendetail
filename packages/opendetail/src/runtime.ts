import { existsSync, readFileSync } from "node:fs";
import OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { resolveIndexPath } from "./build";
import {
  DEFAULT_FALLBACK_TEXT,
  DEFAULT_MODEL,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_STORE,
  DEFAULT_VERBOSITY,
  OPENDETAIL_INDEX_FILE,
} from "./constants";
import { OpenDetailError, OpenDetailIndexNotFoundError } from "./errors";
import {
  createMiniSearchIndex,
  parseOpenDetailIndexArtifact,
  retrieveRelevantChunks,
} from "./search";
import type {
  CreateOpenDetailOptions,
  OpenDetailAnswerInput,
  OpenDetailAnswerResult,
  OpenDetailAssistant,
  OpenDetailIndexArtifact,
  OpenDetailSource,
  OpenDetailStreamEvent,
  OpenDetailStreamResult,
} from "./types";
import { ensureTrailingNewline } from "./utils";
import { parseOpenDetailAnswerInput } from "./validation";

const encoder = new TextEncoder();
const NODE_RUNTIME_REQUIRED_MESSAGE =
  'OpenDetail requires the Node.js runtime. In Next.js route handlers, add `export const runtime = "nodejs"`.';
const INCOMPLETE_RESPONSE_MESSAGE = "The model could not complete the answer.";
const CONTENT_FILTERED_RESPONSE_MESSAGE =
  "The model could not complete the answer because the response was filtered.";
const MAX_OUTPUT_TOKENS_RESPONSE_MESSAGE =
  "The model could not complete the answer before reaching the output token limit.";
const OPENDETAIL_RUNTIME_FAILURE_MESSAGE =
  "OpenDetail could not complete the request.";

const assertNodeRuntime = (): void => {
  if (
    typeof process === "undefined" ||
    typeof process.versions?.node !== "string"
  ) {
    throw new OpenDetailError(NODE_RUNTIME_REQUIRED_MESSAGE);
  }
};

const readIndexArtifact = (
  cwd: string,
  indexPath = OPENDETAIL_INDEX_FILE
): OpenDetailIndexArtifact => {
  const resolvedIndexPath = resolveIndexPath(cwd, indexPath);

  if (!existsSync(resolvedIndexPath)) {
    throw new OpenDetailIndexNotFoundError(resolvedIndexPath);
  }

  const indexFile = readFileSync(resolvedIndexPath, "utf8");
  return parseOpenDetailIndexArtifact(JSON.parse(indexFile));
};

const mapSources = (
  chunks: OpenDetailIndexArtifact["chunks"]
): OpenDetailSource[] =>
  chunks.map((chunk, index) => ({
    headings: chunk.headings,
    id: String(index + 1),
    title: chunk.title,
    url: chunk.url,
  }));

const createFallbackStream = (
  controller: ReadableStreamDefaultController<Uint8Array>
): void => {
  emitEvent(controller, {
    text: DEFAULT_FALLBACK_TEXT,
    type: "delta",
  });
  emitEvent(controller, {
    text: DEFAULT_FALLBACK_TEXT,
    type: "done",
  });
  controller.close();
};

const formatContext = (chunks: OpenDetailIndexArtifact["chunks"]): string =>
  chunks
    .map(
      (chunk, index) =>
        `[SOURCE ${index + 1}]
url: ${chunk.url}
title: ${chunk.title}
headings: ${chunk.headings.join(" > ")}
content:
${chunk.text}`
    )
    .join("\n\n");

const SYSTEM_INSTRUCTIONS = `You are a documentation assistant.
Answer only from the provided sources.
Never invent facts outside the provided sources.
Every factual statement must cite one or more sources with [1], [2], etc.
If the provided sources are insufficient, answer exactly: ${DEFAULT_FALLBACK_TEXT}`;

const createOpenAIRequest = ({
  model,
  question,
  reasoningEffort,
  retrievedChunks,
  store,
  verbosity,
}: {
  model: string;
  question: string;
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  store: boolean;
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
}): ResponseCreateParamsNonStreaming => ({
  input: `Question:
${question}

Sources:
${formatContext(retrievedChunks)}`,
  instructions: SYSTEM_INSTRUCTIONS,
  model,
  reasoning: {
    effort: reasoningEffort,
  },
  store,
  text: {
    format: {
      type: "text",
    },
    verbosity,
  },
});

const createStreamingRequest = (
  request: ResponseCreateParamsNonStreaming
): ResponseCreateParamsStreaming => ({
  ...request,
  stream: true,
});

const getResponseRefusal = (response: Response): string | null => {
  for (const outputItem of response.output) {
    if (outputItem.type !== "message") {
      continue;
    }

    for (const contentPart of outputItem.content) {
      if (
        contentPart.type === "refusal" &&
        contentPart.refusal.trim().length > 0
      ) {
        return contentPart.refusal.trim();
      }
    }
  }

  return null;
};

const getIncompleteResponseMessage = (response: Response): string => {
  if (response.incomplete_details?.reason === "content_filter") {
    return CONTENT_FILTERED_RESPONSE_MESSAGE;
  }

  if (response.incomplete_details?.reason === "max_output_tokens") {
    return MAX_OUTPUT_TOKENS_RESPONSE_MESSAGE;
  }

  return INCOMPLETE_RESPONSE_MESSAGE;
};

const resolveResponseText = (response: Response): string => {
  if (response.error) {
    throw new OpenDetailError(OPENDETAIL_RUNTIME_FAILURE_MESSAGE);
  }

  if (
    response.status === "incomplete" ||
    response.incomplete_details !== null
  ) {
    throw new OpenDetailError(getIncompleteResponseMessage(response));
  }

  const refusal = getResponseRefusal(response);

  if (refusal) {
    return refusal;
  }

  const text = response.output_text.trim();

  return text.length > 0 ? text : DEFAULT_FALLBACK_TEXT;
};

const serializeNdjsonEvent = (event: OpenDetailStreamEvent): Uint8Array =>
  encoder.encode(ensureTrailingNewline(JSON.stringify(event)));

const emitEvent = (
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: OpenDetailStreamEvent
): void => {
  controller.enqueue(serializeNdjsonEvent(event));
};

const getStreamFailureMessage = (event: ResponseStreamEvent): string => {
  if (event.type === "response.incomplete") {
    return getIncompleteResponseMessage(event.response);
  }

  return OPENDETAIL_RUNTIME_FAILURE_MESSAGE;
};

const getPublicStreamErrorMessage = (error: unknown): string => {
  if (
    error instanceof OpenDetailError &&
    [
      NODE_RUNTIME_REQUIRED_MESSAGE,
      INCOMPLETE_RESPONSE_MESSAGE,
      CONTENT_FILTERED_RESPONSE_MESSAGE,
      MAX_OUTPUT_TOKENS_RESPONSE_MESSAGE,
    ].includes(error.message)
  ) {
    return error.message;
  }

  return OPENDETAIL_RUNTIME_FAILURE_MESSAGE;
};

const handleOpenAIStreamEvent = ({
  controller,
  event,
  finalText,
}: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  event: ResponseStreamEvent;
  finalText: string;
}): {
  failed: boolean;
  finalText: string;
} => {
  if (event.type === "response.output_text.delta") {
    emitEvent(controller, {
      text: event.delta,
      type: "delta",
    });

    return {
      failed: false,
      finalText: `${finalText}${event.delta}`,
    };
  }

  if (event.type === "response.output_text.done") {
    return {
      failed: false,
      finalText: event.text,
    };
  }

  if (event.type === "response.refusal.delta") {
    emitEvent(controller, {
      text: event.delta,
      type: "delta",
    });

    return {
      failed: false,
      finalText: `${finalText}${event.delta}`,
    };
  }

  if (event.type === "response.refusal.done") {
    return {
      failed: false,
      finalText: event.refusal,
    };
  }

  if (
    event.type === "error" ||
    event.type === "response.failed" ||
    event.type === "response.incomplete"
  ) {
    emitEvent(controller, {
      message: getStreamFailureMessage(event),
      type: "error",
    });

    return {
      failed: true,
      finalText,
    };
  }

  if (event.type === "response.completed" && finalText.length === 0) {
    try {
      return {
        failed: false,
        finalText: resolveResponseText(event.response),
      };
    } catch (error) {
      emitEvent(controller, {
        message: getPublicStreamErrorMessage(error),
        type: "error",
      });

      return {
        failed: true,
        finalText,
      };
    }
  }

  return {
    failed: false,
    finalText,
  };
};

const streamOpenAIResponse = async ({
  controller,
  getClient,
  model,
  question,
  reasoningEffort,
  retrievedChunks,
  store,
  verbosity,
  abortSignal,
}: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  getClient: () => OpenAI;
  model: string;
  question: string;
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  store: boolean;
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
  abortSignal: AbortSignal;
}): Promise<void> => {
  let finalText = "";
  const request = createStreamingRequest(
    createOpenAIRequest({
      model,
      question,
      reasoningEffort,
      retrievedChunks,
      store,
      verbosity,
    })
  );
  const openAIStream = await getClient().responses.create(request, {
    signal: abortSignal,
  });

  for await (const event of openAIStream) {
    const nextState = handleOpenAIStreamEvent({
      controller,
      event,
      finalText,
    });

    finalText = nextState.finalText;

    if (nextState.failed) {
      return;
    }
  }

  emitEvent(controller, {
    text: finalText.trim().length > 0 ? finalText : DEFAULT_FALLBACK_TEXT,
    type: "done",
  });
};

const createOpenAIClientFactory = (
  client: OpenAI | null | undefined
): (() => OpenAI) => {
  let cachedClient = client ?? null;

  return () => {
    if (cachedClient) {
      return cachedClient;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new OpenDetailError("OPENAI_API_KEY is required at runtime.");
    }

    cachedClient = new OpenAI({
      apiKey,
    });

    return cachedClient;
  };
};

export const createOpenDetail = ({
  client,
  cwd = process.cwd(),
  indexData,
  indexPath,
  model = DEFAULT_MODEL,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
  store = DEFAULT_STORE,
  verbosity = DEFAULT_VERBOSITY,
}: CreateOpenDetailOptions = {}): OpenDetailAssistant => {
  assertNodeRuntime();

  const artifact = indexData ?? readIndexArtifact(cwd, indexPath);
  const miniSearch = createMiniSearchIndex(artifact.chunks);
  const getClient = createOpenAIClientFactory(client);

  const answer = async (
    rawInput: OpenDetailAnswerInput
  ): Promise<OpenDetailAnswerResult> => {
    const { question } = parseOpenDetailAnswerInput(rawInput);
    const retrievedChunks = retrieveRelevantChunks(miniSearch, question);
    const sources = mapSources(retrievedChunks);

    if (retrievedChunks.length === 0) {
      return {
        fallback: true,
        model,
        sources,
        text: DEFAULT_FALLBACK_TEXT,
      };
    }

    const request = createOpenAIRequest({
      model,
      question,
      reasoningEffort,
      retrievedChunks,
      store,
      verbosity,
    });
    const response = await getClient().responses.create(request);

    return {
      fallback: false,
      model: response.model,
      sources,
      text: resolveResponseText(response),
    };
  };

  const stream = (
    rawInput: OpenDetailAnswerInput
  ): Promise<OpenDetailStreamResult> => {
    const { question } = parseOpenDetailAnswerInput(rawInput);
    const retrievedChunks = retrieveRelevantChunks(miniSearch, question);
    const sources = mapSources(retrievedChunks);
    const fallback = retrievedChunks.length === 0;
    const abortController = new AbortController();
    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        emitEvent(controller, {
          model,
          type: "meta",
        });
        emitEvent(controller, {
          sources,
          type: "sources",
        });

        if (fallback) {
          createFallbackStream(controller);
          return;
        }

        streamOpenAIResponse({
          abortSignal: abortController.signal,
          controller,
          getClient,
          model,
          question,
          reasoningEffort,
          retrievedChunks,
          store,
          verbosity,
        })
          .catch((error: unknown) => {
            if (abortController.signal.aborted) {
              return;
            }

            emitEvent(controller, {
              message: getPublicStreamErrorMessage(error),
              type: "error",
            });
          })
          .finally(() => {
            if (!abortController.signal.aborted) {
              controller.close();
            }
          });
      },
      cancel() {
        abortController.abort();
      },
    });

    return Promise.resolve({
      fallback,
      model,
      sources,
      stream: responseStream,
    });
  };

  return {
    answer,
    stream,
  };
};
