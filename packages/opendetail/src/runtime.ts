import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseOutputText,
  ResponseStreamEvent,
  Tool,
} from "openai/resources/responses/responses";
import {
  CONVERSATION_TITLE_FALLBACK_WORD_COUNT,
  DEFAULT_FALLBACK_TEXT,
  DEFAULT_MAX_RETURNED_IMAGES,
  DEFAULT_MODEL,
  DEFAULT_PROMPT_CACHE_RETENTION,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_STORE,
  DEFAULT_VERBOSITY,
  MAX_CONVERSATION_TITLE_LENGTH,
  OPENDETAIL_CONVERSATION_TITLE_INSTRUCTIONS_MARKER,
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
import { resolveIndexPath } from "./paths";
import {
  createMiniSearchIndex,
  parseOpenDetailIndexArtifact,
  retrieveRelevantChunks,
} from "./search";
import {
  createFetchedPageChunk,
  fetchSitePageText,
  filterChunkIdsBySitePaths,
  listPathsNeedingFetch,
} from "./site-pages";
import type {
  CreateOpenDetailOptions,
  OpenDetailAnswerResult,
  OpenDetailAssistant,
  OpenDetailImage,
  OpenDetailIndexArtifact,
  OpenDetailRemoteResourcesConfig,
  OpenDetailRuntimeInput,
  OpenDetailSource,
  OpenDetailStreamEvent,
  OpenDetailStreamResult,
} from "./types";
import { ensureTrailingNewline } from "./utils";
import { parseOpenDetailAnswerInput } from "./validation";

const encoder = new TextEncoder();

const WHITESPACE_SPLIT_PATTERN = /\s+/;

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
    kind: chunk.sourceKind === "page" ? "page" : "local",
    title: chunk.title,
    url: chunk.url,
  }));

const resolveRetrievedChunksForQuestion = async ({
  abortSignal,
  artifact,
  miniSearch,
  question,
  siteFetchOrigin,
  sitePaths,
}: {
  abortSignal?: AbortSignal;
  artifact: OpenDetailIndexArtifact;
  miniSearch: ReturnType<typeof createMiniSearchIndex>;
  question: string;
  siteFetchOrigin?: string;
  sitePaths?: string[];
}): Promise<OpenDetailIndexArtifact["chunks"]> => {
  let allowedChunkIds: Set<string> | undefined;

  if (sitePaths !== undefined && sitePaths.length > 0) {
    allowedChunkIds = filterChunkIdsBySitePaths(artifact.chunks, sitePaths);
  }

  let retrieved = retrieveRelevantChunks(miniSearch, question, {
    allowedChunkIds,
  });

  const fetchConfig = artifact.config.site_pages_fetch;
  const origin = siteFetchOrigin;

  if (
    fetchConfig &&
    origin &&
    sitePaths !== undefined &&
    sitePaths.length > 0
  ) {
    const missingPaths = listPathsNeedingFetch({
      chunks: artifact.chunks,
      fetchConfig,
      origin,
      sitePaths,
    });
    const fetchedChunks: OpenDetailIndexArtifact["chunks"] = [];

    for (const path of missingPaths) {
      try {
        const extracted = await fetchSitePageText({
          abortSignal,
          fetchConfig,
          origin,
          pathname: path,
        });
        fetchedChunks.push(
          createFetchedPageChunk({
            origin,
            pathname: path,
            text: extracted.text,
            title: extracted.title,
          })
        );
      } catch {
        // Omit failed fetches; retrieval still uses indexed chunks.
      }
    }

    retrieved = [...retrieved, ...fetchedChunks];
  }

  return retrieved;
};

const createRemoteTools = (
  remoteResources: OpenDetailRemoteResourcesConfig | undefined
): Tool[] => {
  const tools: Tool[] = [];

  if (remoteResources?.file_search) {
    tools.push({
      max_num_results: remoteResources.file_search.max_num_results,
      type: "file_search",
      vector_store_ids: remoteResources.file_search.vector_store_ids,
    });
  }

  if (remoteResources?.web_search) {
    tools.push({
      filters: remoteResources.web_search.allowed_domains
        ? {
            allowed_domains: remoteResources.web_search.allowed_domains,
          }
        : undefined,
      search_context_size: remoteResources.web_search.search_context_size,
      type: "web_search",
    });
  }

  return tools;
};

const extractOutputTextParts = (response: Response): ResponseOutputText[] => {
  const outputTextParts: ResponseOutputText[] = [];

  for (const outputItem of response.output) {
    if (outputItem.type !== "message") {
      continue;
    }

    for (const contentPart of outputItem.content) {
      if (contentPart.type !== "output_text") {
        continue;
      }

      outputTextParts.push(contentPart);
    }
  }

  return outputTextParts;
};

const extractRemoteSourcesFromResponse = (
  response: Response,
  localSourceCount: number
): OpenDetailSource[] => {
  const seenRemoteUrls = new Set<string>();
  const remoteSources: OpenDetailSource[] = [];

  for (const contentPart of extractOutputTextParts(response)) {
    for (const annotation of contentPart.annotations) {
      if (annotation.type === "url_citation") {
        if (seenRemoteUrls.has(annotation.url)) {
          continue;
        }

        seenRemoteUrls.add(annotation.url);
        remoteSources.push({
          headings: [],
          id: String(localSourceCount + remoteSources.length + 1),
          kind: "remote",
          title: annotation.title,
          url: annotation.url,
        });
        continue;
      }

      if (annotation.type !== "file_citation") {
        continue;
      }

      const fileCitationUrl = `vector-store-file://${annotation.file_id}`;

      if (seenRemoteUrls.has(fileCitationUrl)) {
        continue;
      }

      seenRemoteUrls.add(fileCitationUrl);
      remoteSources.push({
        headings: [],
        id: String(localSourceCount + remoteSources.length + 1),
        kind: "remote",
        title: annotation.filename,
        url: fileCitationUrl,
      });
    }
  }

  return remoteSources;
};

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

const formatContext = (chunks: OpenDetailIndexArtifact["chunks"]): string =>
  chunks
    .map(
      (chunk, index) =>
        `[SOURCE ${index + 1}]
kind: ${chunk.sourceKind ?? "local"}
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

const SYSTEM_INSTRUCTIONS = `You are an in-product informational assistant.
Answer from the Sources block in the user message, from any project instructions above, and from tool results (for example file search or web search) when tools are available.
Never present unsupported guesses as facts about the product or its materials.
Every factual statement grounded in those sources or tool results must cite one or more sources with [1], [2], etc.
Use normal sentence case and never answer in all caps unless the source text is all caps.
If the provided sources and tools do not answer the question, do not answer from general knowledge.
Instead, give a short, direct response that the topic is not covered in the available materials or cannot be confirmed from them.
If the question asks about support, setup, or compatibility, say you could not find that described in the available sources.
Only include citations when you are citing an actual source.
Do not use canned wording that claims you searched "the configured docs" or similar fixed apologies.`;
const MAX_PROMPT_CACHE_KEY_LENGTH = 64;

const createInstructionsHash = (instructions: string): string =>
  createHash("sha256").update(instructions).digest("hex");

type AssistantInstructionsSource =
  | "custom_path"
  | "inline_option"
  | "none"
  | "preferred_file"
  | "root_file";

interface ResolvedAssistantInstructions {
  source: AssistantInstructionsSource;
  sourceLabel: string;
  text: string;
}

const resolveAssistantInstructions = ({
  assistantInstructions,
  assistantInstructionsPath,
  cwd,
}: {
  assistantInstructions?: string;
  assistantInstructionsPath?: string;
  cwd: string;
}): ResolvedAssistantInstructions => {
  if (assistantInstructions) {
    return {
      source: "inline_option",
      sourceLabel: "assistantInstructions option",
      text: assistantInstructions.trim(),
    };
  }

  if (assistantInstructionsPath) {
    const resolvedInstructionsPath = path.resolve(
      /* turbopackIgnore: true */ cwd,
      assistantInstructionsPath
    );

    if (!existsSync(resolvedInstructionsPath)) {
      throw new OpenDetailError(
        `Assistant instructions file not found at ${resolvedInstructionsPath}.`
      );
    }

    return {
      source: "custom_path",
      sourceLabel: `assistantInstructionsPath (${path.relative(cwd, resolvedInstructionsPath) || resolvedInstructionsPath})`,
      text: readFileSync(resolvedInstructionsPath, "utf8").trim(),
    };
  }

  const instructionCandidates: Array<{
    resolvedPath: string;
    source: AssistantInstructionsSource;
    sourceLabel: string;
  }> = [
    {
      resolvedPath: path.resolve(
        /* turbopackIgnore: true */ cwd,
        OPENDETAIL_PREFERRED_INSTRUCTIONS_FILE
      ),
      source: "preferred_file",
      sourceLabel: OPENDETAIL_PREFERRED_INSTRUCTIONS_FILE,
    },
    {
      resolvedPath: path.resolve(
        /* turbopackIgnore: true */ cwd,
        OPENDETAIL_INSTRUCTIONS_FILE
      ),
      source: "root_file",
      sourceLabel: OPENDETAIL_INSTRUCTIONS_FILE,
    },
  ];

  for (const candidate of instructionCandidates) {
    if (!existsSync(candidate.resolvedPath)) {
      continue;
    }

    const instructionsText = readFileSync(
      candidate.resolvedPath,
      "utf8"
    ).trim();

    if (instructionsText.length === 0) {
      continue;
    }

    return {
      source: candidate.source,
      sourceLabel: candidate.sourceLabel,
      text: instructionsText,
    };
  }

  return {
    source: "none",
    sourceLabel: "none",
    text: "",
  };
};

const buildSystemInstructions = ({
  resolvedAssistantInstructions,
}: {
  resolvedAssistantInstructions: ResolvedAssistantInstructions;
}): string => {
  if (resolvedAssistantInstructions.text.length === 0) {
    return SYSTEM_INSTRUCTIONS;
  }

  return `${SYSTEM_INSTRUCTIONS}

Project-specific instructions loaded from ${resolvedAssistantInstructions.sourceLabel}:
${resolvedAssistantInstructions.text}`;
};

const createPromptCacheKey = ({
  question,
  instructionsHash,
  manifestHash,
  model,
  promptCacheKey,
  reasoningEffort,
  retrievedChunks,
  sitePaths,
  verbosity,
}: {
  question: string;
  instructionsHash: string;
  manifestHash: string;
  model: string;
  promptCacheKey?: string;
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  sitePaths?: string[];
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
}): string => {
  if (promptCacheKey) {
    return promptCacheKey.length <= MAX_PROMPT_CACHE_KEY_LENGTH
      ? promptCacheKey
      : createHash("sha256").update(promptCacheKey).digest("hex");
  }

  const cacheMaterial = JSON.stringify({
    question,
    instructionsHash,
    manifestHash,
    model,
    reasoningEffort,
    sitePaths: sitePaths ?? null,
    sourceChunkIds: retrievedChunks.map((chunk) => chunk.id),
    verbosity,
  });

  return createHash("sha256").update(cacheMaterial).digest("hex");
};

const createModelInput = ({
  question,
  retrievedChunks,
}: {
  question: string;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
}): string => `Sources:
${retrievedChunks.length > 0 ? formatContext(retrievedChunks) : "none"}

Indexed source matches:
${retrievedChunks.length > 0 ? "yes" : "no"}

Question:
${question}`;

const createOpenAIRequest = ({
  instructionsHash,
  manifestHash,
  model,
  promptCacheKey,
  promptCacheRetention,
  question,
  reasoningEffort,
  remoteTools,
  retrievedChunks,
  sitePaths,
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
  remoteTools: Tool[];
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  sitePaths?: string[];
  store: boolean;
  systemInstructions: string;
  verbosity: NonNullable<CreateOpenDetailOptions["verbosity"]>;
}): ResponseCreateParamsNonStreaming => ({
  ...(remoteTools.length > 0
    ? {
        include: [
          "file_search_call.results",
          "web_search_call.action.sources",
          "web_search_call.results",
        ],
      }
    : {}),
  input: createModelInput({
    question,
    retrievedChunks,
  }),
  instructions: systemInstructions,
  model,
  prompt_cache_key: createPromptCacheKey({
    question,
    instructionsHash,
    manifestHash,
    model,
    promptCacheKey,
    reasoningEffort,
    retrievedChunks,
    sitePaths,
    verbosity,
  }),
  prompt_cache_retention: toOpenAIPromptCacheRetention(promptCacheRetention),
  reasoning: {
    effort: reasoningEffort,
  },
  store,
  ...(remoteTools.length > 0 ? { tools: remoteTools } : {}),
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

const toOpenAIPromptCacheRetention = (
  promptCacheRetention: NonNullable<
    ResponseCreateParamsNonStreaming["prompt_cache_retention"]
  >
): ResponseCreateParamsNonStreaming["prompt_cache_retention"] =>
  (promptCacheRetention === "in-memory"
    ? "in_memory"
    : promptCacheRetention) as ResponseCreateParamsNonStreaming["prompt_cache_retention"];

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

const buildConversationTitleInstructions = (): string =>
  `${OPENDETAIL_CONVERSATION_TITLE_INSTRUCTIONS_MARKER}

You write very short chat conversation titles.
Rules:
- Output 3 to 7 words only.
- No quotation marks, no markdown, no trailing punctuation.
- Describe what the user is asking about.
- Output a single line only.`;

const fallbackTitleFromQuestion = (question: string): string => {
  const words = question
    .trim()
    .split(WHITESPACE_SPLIT_PATTERN)
    .filter((word) => word.length > 0)
    .slice(0, CONVERSATION_TITLE_FALLBACK_WORD_COUNT);
  const joined = words.join(" ");

  return joined.length > MAX_CONVERSATION_TITLE_LENGTH
    ? joined.slice(0, MAX_CONVERSATION_TITLE_LENGTH).trim()
    : joined;
};

const normalizeConversationTitle = (raw: string): string => {
  const collapsed = raw
    .replaceAll(/[\r\n]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (collapsed.length === 0) {
    return "";
  }

  const unquoted = collapsed.replace(/^["']+|["']+$/g, "").trim();

  return unquoted.length > MAX_CONVERSATION_TITLE_LENGTH
    ? unquoted.slice(0, MAX_CONVERSATION_TITLE_LENGTH).trim()
    : unquoted;
};

const createConversationTitleRequest = ({
  model,
  question,
}: {
  model: string;
  question: string;
}): ResponseCreateParamsNonStreaming => ({
  input: question,
  instructions: buildConversationTitleInstructions(),
  max_output_tokens: 48,
  model,
  reasoning: {
    effort: "none",
  },
  store: false,
  text: {
    format: {
      type: "text",
    },
    verbosity: "low",
  },
});

const emitConversationTitle = async ({
  abortSignal,
  controller,
  getClient,
  model,
  question,
}: {
  abortSignal: AbortSignal;
  controller: ReadableStreamDefaultController<Uint8Array>;
  getClient: () => OpenAI;
  model: string;
  question: string;
}): Promise<void> => {
  let titleText = fallbackTitleFromQuestion(question);

  try {
    if (!abortSignal.aborted) {
      const response = await getClient().responses.create(
        createConversationTitleRequest({
          model,
          question,
        }),
        {
          signal: abortSignal,
        }
      );
      const raw = resolveResponseText(response);
      const normalized = normalizeConversationTitle(raw);

      if (normalized.length > 0) {
        titleText = normalized;
      }
    }
  } catch {
    // Keep deterministic fallback from the question.
  }

  if (abortSignal.aborted) {
    return;
  }

  emitEvent(controller, {
    title: titleText,
    type: "title",
  });
};

const getStreamFailurePublicError = (event: ResponseStreamEvent) => {
  if (event.type === "response.incomplete") {
    return toOpenDetailPublicError(
      new OpenDetailModelIncompleteError(
        getIncompleteResponseMessage(event.response)
      )
    );
  }

  return toOpenDetailPublicError(event);
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
      param: publicError.param,
      provider: publicError.provider,
      providerCode: publicError.providerCode,
      requestId: publicError.requestId,
      retryable: publicError.retryable,
      status: publicError.status,
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
        param: publicError.param,
        provider: publicError.provider,
        providerCode: publicError.providerCode,
        requestId: publicError.requestId,
        retryable: publicError.retryable,
        status: publicError.status,
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
  remoteTools,
  reasoningEffort,
  retrievedChunks,
  sitePaths,
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
  remoteTools: Tool[];
  reasoningEffort: NonNullable<CreateOpenDetailOptions["reasoningEffort"]>;
  retrievedChunks: OpenDetailIndexArtifact["chunks"];
  sitePaths?: string[];
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
      remoteTools,
      reasoningEffort,
      retrievedChunks,
      sitePaths,
      store,
      systemInstructions,
      verbosity,
    })
  );
  const openAIStream = await getClient().responses.create(request, {
    signal: abortSignal,
  });
  const localSources = mapSources(retrievedChunks);

  for await (const event of openAIStream) {
    if (event.type === "response.completed") {
      const remoteSources = extractRemoteSourcesFromResponse(
        event.response,
        localSources.length
      );

      if (remoteSources.length > 0) {
        emitEvent(controller, {
          sources: [...localSources, ...remoteSources],
          type: "sources",
        });
      }
    }

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
  cwd = ".",
  indexData,
  indexPath,
  model = DEFAULT_MODEL,
  promptCacheKey,
  promptCacheRetention = DEFAULT_PROMPT_CACHE_RETENTION,
  remoteResources,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
  siteFetchOrigin: defaultSiteFetchOrigin,
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
  const systemInstructions = buildSystemInstructions({
    resolvedAssistantInstructions,
  });
  const instructionsHash = createInstructionsHash(systemInstructions);
  const miniSearch = createMiniSearchIndex(artifact.chunks);
  const remoteTools = createRemoteTools(
    remoteResources ?? artifact.config.remote_resources
  );
  const getClient = createOpenAIClientFactory(client);

  if (!client) {
    getClient();
  }

  const answer = async (
    rawInput: OpenDetailRuntimeInput
  ): Promise<OpenDetailAnswerResult> => {
    const { question, sitePaths } = parseOpenDetailAnswerInput(rawInput);
    const siteFetchOrigin = rawInput.siteFetchOrigin ?? defaultSiteFetchOrigin;
    const retrievedChunks = await resolveRetrievedChunksForQuestion({
      artifact,
      miniSearch,
      question,
      siteFetchOrigin,
      sitePaths,
    });
    const images = collectRelevantImages(retrievedChunks);
    const localSources = mapSources(retrievedChunks);
    const sources = [...localSources];
    const fallback = retrievedChunks.length === 0;

    const request = createOpenAIRequest({
      instructionsHash,
      manifestHash: artifact.manifestHash,
      model,
      promptCacheKey,
      promptCacheRetention,
      question,
      remoteTools,
      reasoningEffort,
      retrievedChunks,
      sitePaths,
      store,
      systemInstructions,
      verbosity,
    });
    const response = await getClient().responses.create(request);
    const remoteSources = extractRemoteSourcesFromResponse(
      response,
      localSources.length
    );

    return {
      fallback,
      images,
      model: response.model,
      sources: [...sources, ...remoteSources],
      text: resolveResponseText(response),
    };
  };

  const stream = async (
    rawInput: OpenDetailRuntimeInput
  ): Promise<OpenDetailStreamResult> => {
    const {
      conversationTitle: conversationTitleRequested,
      question,
      sitePaths,
    } = parseOpenDetailAnswerInput(rawInput);
    const siteFetchOrigin = rawInput.siteFetchOrigin ?? defaultSiteFetchOrigin;
    const abortController = new AbortController();
    const retrievedChunks = await resolveRetrievedChunksForQuestion({
      abortSignal: abortController.signal,
      artifact,
      miniSearch,
      question,
      siteFetchOrigin,
      sitePaths,
    });
    const images = collectRelevantImages(retrievedChunks);
    const localSources = mapSources(retrievedChunks);
    const sources = [...localSources];
    const fallback = retrievedChunks.length === 0;
    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        emitEvent(controller, {
          model,
          type: "meta",
        });
        emitEvent(controller, {
          sources: localSources,
          type: "sources",
        });
        emitEvent(controller, {
          images,
          type: "images",
        });

        const titlePromise =
          conversationTitleRequested === true
            ? emitConversationTitle({
                abortSignal: abortController.signal,
                controller,
                getClient,
                model,
                question,
              })
            : Promise.resolve();

        (() => {
          Promise.allSettled([
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
              remoteTools,
              reasoningEffort,
              retrievedChunks,
              sitePaths,
              store,
              systemInstructions,
              verbosity,
            }),
            titlePromise,
          ]).then((results) => {
            const streamOutcome = results[0];

            if (
              streamOutcome.status === "rejected" &&
              !abortController.signal.aborted
            ) {
              const publicError = toOpenDetailPublicError(streamOutcome.reason);
              emitEvent(controller, {
                code: publicError.code,
                message: publicError.message,
                param: publicError.param,
                provider: publicError.provider,
                providerCode: publicError.providerCode,
                requestId: publicError.requestId,
                retryable: publicError.retryable,
                status: publicError.status,
                type: "error",
              });
            }

            if (!abortController.signal.aborted) {
              controller.close();
            }
          });
        })();
      },
      cancel() {
        abortController.abort();
      },
    });

    return {
      fallback,
      images,
      model,
      sources,
      stream: responseStream,
    };
  };

  return {
    answer,
    stream,
  };
};
