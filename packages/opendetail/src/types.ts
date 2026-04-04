import type OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsBase,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";

export interface OpenDetailConfig {
  base_path: string;
  exclude: string[];
  include: string[];
  media?: OpenDetailMediaConfig;
  remote_resources?: OpenDetailRemoteResourcesConfig;
  version: 1;
}

export type OpenDetailIntegrationMode = "hosted" | "self-hosted";

export interface OpenDetailMediaConfig {
  base_path: string;
  exclude: string[];
  include: string[];
}

export interface OpenDetailRemoteWebSearchConfig {
  allowed_domains?: string[];
  search_context_size?: "low" | "medium" | "high";
}

export interface OpenDetailRemoteFileSearchConfig {
  max_num_results?: number;
  vector_store_ids: string[];
}

export interface OpenDetailRemoteResourcesConfig {
  file_search?: OpenDetailRemoteFileSearchConfig;
  web_search?: OpenDetailRemoteWebSearchConfig;
}

export interface OpenDetailChunkImage {
  alt: string | null;
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
  kind?: "local" | "remote";
  title: string;
  url: string;
}

export interface OpenDetailImage extends OpenDetailChunkImage {
  sourceIds: string[];
}

export interface OpenDetailAnswerInput {
  conversationTitle?: boolean;
  question: string;
}

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
  fallback: boolean;
  images: OpenDetailImage[];
  model: string;
  sources: OpenDetailSource[];
  text: string;
}

export interface OpenDetailStreamResult {
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
  remoteResources?: OpenDetailRemoteResourcesConfig;
  store?: boolean;
  verbosity?: NonNullable<
    NonNullable<ResponseCreateParamsBase["text"]>["verbosity"]
  >;
}

export interface OpenDetailAssistant {
  answer(input: OpenDetailAnswerInput): Promise<OpenDetailAnswerResult>;
  stream(input: OpenDetailAnswerInput): Promise<OpenDetailStreamResult>;
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
