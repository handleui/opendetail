import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
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
  DEFAULT_MAX_RETURNED_IMAGES,
  DEFAULT_MODEL,
  DEFAULT_PROMPT_CACHE_RETENTION,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_STORE,
  DEFAULT_VERBOSITY,
  OPENDETAIL_INDEX_FILE,
  OPENDETAIL_INSTRUCTIONS_FILE,
  OPENDETAIL_PREFERRED_INSTRUCTIONS_FILE,
} from "./constants";
import {
  CONTENT_FILTERED_RESPONSE_MESSAGE,
  INCOMPLETE_RESPONSE_MESSAGE,
  MAX_OUTPUT_TOKENS_RESPONSE_MESSAGE,
  OPENDETAIL_RUNTIME_FAILURE_MESSAGE,
  OpenDetailError,
  OpenDetailIndexNotFoundError,
  OpenDetailInvalidRuntimeError,
  OpenDetailMissingApiKeyError,
  OpenDetailModelIncompleteError,
  toOpenDetailPublicError,
} from "./errors";
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
  OpenDetailImage,
  OpenDetailIndexArtifact,
  OpenDetailSource,
  OpenDetailStreamEvent,
  OpenDetailStreamResult,
} from "./types";
import { ensureTrailingNewline } from "./utils";
import { parseOpenDetailAnswerInput } from "./validation";

const encoder = new TextEncoder();

const assertNodeRuntime = (): void => {
  if (
    typeof process === "undefined" ||
    typeof process.versions?.node !== "string"
  ) {
    throw new OpenDetailInvalidRuntimeError();
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

const collectRelevantImages = (
  chunks: OpenDetailIndexArtifact["chunks"]
): OpenDetailImage[] => {
  const imagesByUrl = new Map<string, OpenDetailImage>();
  const images: OpenDetailImage[] = [];

  for (const [chunkIndex, chunk] of chunks.entries()) {
    const sourceId = String(chunkIndex + 1);

    for (const chunkImage of chunk.images ?? []) {
      const existingImage = imagesByUrl.get(chunkImage.url);

      if (existingImage) {
        if (!existingImage.sourceIds.includes(sourceId)) {
          existingImage.sourceIds.push(sourceId);
        }

        continue;
      }

      if (images.length >= DEFAULT_MAX_RETURNED_IMAGES) {
        continue;
      }

      const nextImage: OpenDetailImage = {
        alt: chunkImage.alt,
        sourceIds: [sourceId],
        title: chunkImage.title,
        url: chunkImage.url,
      };

      imagesByUrl.set(chunkImage.url, nextImage);
      images.push(nextImage);
    }
  }

  return images;
};

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
images:
${formatImageContext(chunk.images)}
content:
${chunk.text}`
    )
    .join("\n\n");

const formatImageContext = (
  images: OpenDetailIndexArtifact["chunks"][number]["images"]
): string => {
  if (!images?.length) {
    return "none";
  }

  return images
    .map((image, index) => {
      const details = [
        image.alt ? `alt: ${image.alt}` : null,
        image.title ? `title: ${image.title}` : null,
      ].filter(Boolean);

      return details.length > 0
        ? `- image ${index + 1}: ${details.join(", ")}`
        : `- image ${index + 1}`;
    })
    .join("\n");
};

const SYSTEM_INSTRUCTIONS = `You are a documentation assistant.
Answer only from the provided sources.
Never invent facts outside the provided sources.
Every factual statement must cite one or more sources with [1], [2], etc.
If the provided sources are insufficient, answer exactly: ${DEFAULT_FALLBACK_TEXT}`;

const createInstructionsHash = (instructions: string): string =>
  createHash("sha256").update(instructions).digest("hex");

const resolveAssistantInstructions = ({
  assistantInstructions,
  assistantInstructionsPath,
  cwd,
}: {
  assistantInstructions?: string;
  assistantInstructionsPath?: string;
  cwd: string;
}): string => {
  if (assistantInstructions !== undefined) {
    return assistantInstructions.trim();
  }

  const instructionCandidates = assistantInstructionsPath
    ? [path.resolve(cwd, assistantInstructionsPath)]
    : [
        path.resolve(cwd, OPENDETAIL_PREFERRED_INSTRUCTIONS_FILE),
        path.resolve(cwd, OPENDETAIL_INSTRUCTIONS_FILE),
      ];

  for (const instructionsPath of instructionCandidates) {
    if (!existsSync(instructionsPath)) {
      continue;
    }

    return readFileSync(instructionsPath, "utf8").trim();
  }

  return "";
};

const buildSystemInstructions = (assistantInstructions: string): string => {
  if (assistantInstructions.length === 0) {
    return SYSTEM_INSTRUCTIONS;
  }

  return `${SYSTEM_INSTRUCTIONS}

Project-specific instructions loaded from ${OPENDETAIL_INSTRUCTIONS_FILE}:
${assistantInstructions}`;
};

const createPromptCacheKey = ({
  instructionsHash,
  manifestHash,
  promptCacheKey,
  retrievedChunks,
}: {
  instructionsHash: string;
  manifestHash: string;
  promptCacheKey?: string;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
}): string => {
  if (promptCacheKey) {
    return promptCacheKey;
  }

  const cacheMaterial = JSON.stringify({
    instructionsHash,
    manifestHash,
    sourceChunkIds: retrievedChunks.map((chunk) => chunk.id),
  });

  return `opendetail:${createHash("sha256").update(cacheMaterial).digest("hex")}`;
};

const createOpenAIRequest = ({
  instructionsHash,
  manifestHash,
  model,
  promptCacheKey,
  promptCacheRetention,
  question,
  reasoningEffort,
  retrievedChunks,
  store,
  systemInstructions,
  verbosity,
}: {
  instructionsHash: string;
  manifestHash: string;
  model: string;
  promptCacheKey?: string;
  promptCacheRetention: NonNullable<
    ResponseCreateParamsNonStreaming["prompt_cache_retention"]
  >;
  question: string;
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  store: boolean;
  systemInstructions: string;
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
}): ResponseCreateParamsNonStreaming => ({
  input: `Question:
${question}

Sources:
${formatContext(retrievedChunks)}`,
  instructions: systemInstructions,
  model,
  prompt_cache_key: createPromptCacheKey({
    instructionsHash,
    manifestHash,
    promptCacheKey,
    retrievedChunks,
  }),
  prompt_cache_retention: promptCacheRetention,
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
    throw new OpenDetailModelIncompleteError(
      getIncompleteResponseMessage(response)
    );
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

const getStreamFailurePublicError = (event: ResponseStreamEvent) => {
  if (event.type === "response.incomplete") {
    return toOpenDetailPublicError(
      new OpenDetailModelIncompleteError(
        getIncompleteResponseMessage(event.response)
      )
    );
  }

  return toOpenDetailPublicError(
    new OpenDetailError(OPENDETAIL_RUNTIME_FAILURE_MESSAGE)
  );
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
    const publicError = getStreamFailurePublicError(event);
    emitEvent(controller, {
      code: publicError.code,
      message: publicError.message,
      retryable: publicError.retryable,
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
      const publicError = toOpenDetailPublicError(error);
      emitEvent(controller, {
        code: publicError.code,
        message: publicError.message,
        retryable: publicError.retryable,
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
  instructionsHash,
  manifestHash,
  model,
  promptCacheKey,
  promptCacheRetention,
  question,
  reasoningEffort,
  retrievedChunks,
  store,
  systemInstructions,
  verbosity,
  abortSignal,
}: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  getClient: () => OpenAI;
  instructionsHash: string;
  manifestHash: string;
  model: string;
  promptCacheKey?: string;
  promptCacheRetention: NonNullable<
    ResponseCreateParamsNonStreaming["prompt_cache_retention"]
  >;
  question: string;
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  store: boolean;
  systemInstructions: string;
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
  abortSignal: AbortSignal;
}): Promise<void> => {
  let finalText = "";
  const request = createStreamingRequest(
    createOpenAIRequest({
      instructionsHash,
      manifestHash,
      model,
      promptCacheKey,
      promptCacheRetention,
      question,
      reasoningEffort,
      retrievedChunks,
      store,
      systemInstructions,
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
      throw new OpenDetailMissingApiKeyError();
    }

    cachedClient = new OpenAI({
      apiKey,
    });

    return cachedClient;
  };
};

export const createOpenDetail = ({
  assistantInstructions,
  assistantInstructionsPath,
  client,
  cwd = process.cwd(),
  indexData,
  indexPath,
  model = DEFAULT_MODEL,
  promptCacheKey,
  promptCacheRetention = DEFAULT_PROMPT_CACHE_RETENTION,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
  store = DEFAULT_STORE,
  verbosity = DEFAULT_VERBOSITY,
}: CreateOpenDetailOptions = {}): OpenDetailAssistant => {
  assertNodeRuntime();

  const artifact = indexData ?? readIndexArtifact(cwd, indexPath);
  const resolvedAssistantInstructions = resolveAssistantInstructions({
    assistantInstructions,
    assistantInstructionsPath,
    cwd,
  });
  const systemInstructions = buildSystemInstructions(
    resolvedAssistantInstructions
  );
  const instructionsHash = createInstructionsHash(systemInstructions);
  const miniSearch = createMiniSearchIndex(artifact.chunks);
  const getClient = createOpenAIClientFactory(client);

  if (!client) {
    getClient();
  }

  const answer = async (
    rawInput: OpenDetailAnswerInput
  ): Promise<OpenDetailAnswerResult> => {
    const { question } = parseOpenDetailAnswerInput(rawInput);
    const retrievedChunks = retrieveRelevantChunks(miniSearch, question);
    const images = collectRelevantImages(retrievedChunks);
    const sources = mapSources(retrievedChunks);

    if (retrievedChunks.length === 0) {
      return {
        fallback: true,
        images,
        model,
        sources,
        text: DEFAULT_FALLBACK_TEXT,
      };
    }

    const request = createOpenAIRequest({
      instructionsHash,
      manifestHash: artifact.manifestHash,
      model,
      promptCacheKey,
      promptCacheRetention,
      question,
      reasoningEffort,
      retrievedChunks,
      store,
      systemInstructions,
      verbosity,
    });
    const response = await getClient().responses.create(request);

    return {
      fallback: false,
      images,
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
    const images = collectRelevantImages(retrievedChunks);
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
        emitEvent(controller, {
          images,
          type: "images",
        });

        if (fallback) {
          createFallbackStream(controller);
          return;
        }

        streamOpenAIResponse({
          abortSignal: abortController.signal,
          controller,
          getClient,
          instructionsHash,
          manifestHash: artifact.manifestHash,
          model,
          promptCacheKey,
          promptCacheRetention,
          question,
          reasoningEffort,
          retrievedChunks,
          store,
          systemInstructions,
          verbosity,
        })
          .catch((error: unknown) => {
            if (abortController.signal.aborted) {
              return;
            }

            const publicError = toOpenDetailPublicError(error);
            emitEvent(controller, {
              code: publicError.code,
              message: publicError.message,
              retryable: publicError.retryable,
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
      images,
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
