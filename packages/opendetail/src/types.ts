import type OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsBase,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";

export interface OpenDetailContentRoot {
  exclude: string[];
  include: string[];
  /** Public URL prefix where this root’s pages are served (e.g. `/docs`, `/`). */
  public_path: string;
}

/** OpenAI `file_search` tool (vector stores). */
export interface OpenDetailFetchFileSearchConfig {
  max_num_results?: number;
  vector_store_ids: string[];
}

/** OpenAI `web_search` tool. */
export interface OpenDetailFetchWebSearchConfig {
  allowed_domains?: string[];
  search_context_size?: "low" | "medium" | "high";
}

/**
 * Optional OpenAI Responses API remote tools (`file_search`, `web_search`).
 * Configure in `opendetail.toml` as `[fetch.file_search]` / `[fetch.web_search]`.
 */
export interface OpenDetailFetchConfig {
  file_search?: OpenDetailFetchFileSearchConfig;
  web_search?: OpenDetailFetchWebSearchConfig;
}

export interface OpenDetailConfig {
  /** One or more MD/MDX roots; each has its own `public_path` for citation URLs. */
  content: OpenDetailContentRoot[];
  /** Optional OpenAI remote tools; same shape as `[fetch]` in `opendetail.toml`. */
  fetch?: OpenDetailFetchConfig;
  /** Optional path (relative to cwd) to a knowledge sidecar TOML with `[[asset]]` entries. */
  knowledge?: string;
  media?: OpenDetailMediaConfig;
  /** Default model id for `createOpenDetail` when not overridden in code. */
  model?: string;
  version: 1;
}

export type OpenDetailIntegrationMode = "hosted" | "self-hosted";

export interface OpenDetailMediaConfig {
  exclude: string[];
  include: string[];
  public_path: string;
}

export interface OpenDetailChunkImage {
  alt: string | null;
  /** Optional assistant-facing copy merged from `.opendetail/knowledge.toml` [[asset]] entries. */
  knowledgeSummary?: string;
  /** Optional assistant-facing title merged from the knowledge sidecar. */
  knowledgeTitle?: string;
  title: string | null;
  url: string;
}

export interface OpenDetailChunk {
  anchor: string | null;
  filePath: string;
  headings: string[];
  id: string;
  images?: OpenDetailChunkImage[];
  relativePath: string;
  /** First [[content]] root is treated as primary docs; additional roots as `page` for source styling. */
  sourceKind?: "local" | "page";
  text: string;
  title: string;
  url: string;
}

export interface OpenDetailIndexArtifact {
  chunks: OpenDetailChunk[];
  config: OpenDetailConfig;
  generatedAt: string;
  manifestHash: string;
  version: 1;
}

export interface BuildOpenDetailIndexOptions {
  configPath?: string;
  cwd?: string;
  outputPath?: string;
}

export interface BuildOpenDetailIndexResult {
  artifact: OpenDetailIndexArtifact;
  outputPath: string;
}

export interface OpenDetailSource {
  headings: string[];
  id: string;
  kind?: "local" | "page" | "remote";
  title: string;
  url: string;
}

export interface OpenDetailImage extends OpenDetailChunkImage {
  sourceIds: string[];
}

export interface OpenDetailAnswerInput {
  conversationTitle?: boolean;
  question: string;
  /**
   * Restrict retrieval to chunks whose public URL path matches these prefixes
   * (e.g. current page scope in the UI).
   */
  sitePaths?: string[];
}

export type OpenDetailRuntimeInput = OpenDetailAnswerInput;

export type OpenDetailErrorCode =
  | "invalid_request"
  | "invalid_runtime"
  | "method_not_allowed"
  | "missing_api_key"
  | "missing_index"
  | "model_incomplete"
  | "provider_auth"
  | "provider_invalid_request"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "request_failed";

export interface OpenDetailPublicError {
  code: OpenDetailErrorCode;
  message: string;
  param: string | null;
  provider: "openai" | null;
  providerCode: string | null;
  requestId: string | null;
  retryable: boolean;
  status: number | null;
}

export interface OpenDetailAnswerResult {
  /**
   * `true` when lexical retrieval matched **no indexed chunks** for this request.
   * The model may still answer using remote tools (`file_search`, `web_search`) or other context;
   * this flag does not mean the final text is ungrounded.
   */
  fallback: boolean;
  images: OpenDetailImage[];
  model: string;
  sources: OpenDetailSource[];
  text: string;
}

export interface OpenDetailStreamResult {
  /**
   * Same semantics as {@link OpenDetailAnswerResult.fallback} for the non-streaming result.
   */
  fallback: boolean;
  images: OpenDetailImage[];
  model: string;
  sources: OpenDetailSource[];
  stream: ReadableStream<Uint8Array>;
}

export interface CreateOpenDetailOptions {
  assistantInstructions?: string;
  assistantInstructionsPath?: string;
  client?: OpenAI | null;
  cwd?: string;
  /** Overrides `fetch` from the index artifact when set. */
  fetch?: OpenDetailFetchConfig;
  indexData?: OpenDetailIndexArtifact;
  indexPath?: string;
  model?: string;
  promptCacheKey?: string;
  promptCacheRetention?: NonNullable<
    ResponseCreateParamsBase["prompt_cache_retention"]
  >;
  reasoningEffort?: NonNullable<
    NonNullable<ResponseCreateParamsBase["reasoning"]>["effort"]
  >;
  store?: boolean;
  verbosity?: NonNullable<
    NonNullable<ResponseCreateParamsBase["text"]>["verbosity"]
  >;
}

export interface OpenDetailAssistant {
  answer(input: OpenDetailRuntimeInput): Promise<OpenDetailAnswerResult>;
  stream(input: OpenDetailRuntimeInput): Promise<OpenDetailStreamResult>;
}

export interface OpenDetailMetaEvent {
  model: string;
  type: "meta";
}

export interface OpenDetailSourcesEvent {
  sources: OpenDetailSource[];
  type: "sources";
}

export interface OpenDetailImagesEvent {
  images: OpenDetailImage[];
  type: "images";
}

export interface OpenDetailTitleEvent {
  title: string;
  type: "title";
}

export interface OpenDetailDeltaEvent {
  text: string;
  type: "delta";
}

export interface OpenDetailDoneEvent {
  text: string;
  type: "done";
}

export interface OpenDetailErrorEvent extends OpenDetailPublicError {
  type: "error";
}

export type OpenDetailStreamEvent =
  | OpenDetailMetaEvent
  | OpenDetailSourcesEvent
  | OpenDetailImagesEvent
  | OpenDetailTitleEvent
  | OpenDetailDeltaEvent
  | OpenDetailDoneEvent
  | OpenDetailErrorEvent;

export type OpenDetailResponseCreateParamsNonStreaming =
  ResponseCreateParamsNonStreaming;
export type OpenDetailResponseCreateParamsStreaming =
  ResponseCreateParamsStreaming;
export type OpenDetailResponseObject = Response;
export type OpenDetailResponseStreamEvent = ResponseStreamEvent;
