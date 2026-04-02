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
  version: 1;
}

export interface OpenDetailMediaConfig {
  base_path: string;
  exclude: string[];
  include: string[];
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
  title: string;
  url: string;
}

export interface OpenDetailImage extends OpenDetailChunkImage {
  sourceIds: string[];
}

export interface OpenDetailAnswerInput {
  question: string;
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
  client?: OpenAI | null;
  cwd?: string;
  indexData?: OpenDetailIndexArtifact;
  indexPath?: string;
  model?: string;
  reasoningEffort?: NonNullable<
    NonNullable<ResponseCreateParamsBase["reasoning"]>["effort"]
  >;
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

export interface OpenDetailDeltaEvent {
  text: string;
  type: "delta";
}

export interface OpenDetailDoneEvent {
  text: string;
  type: "done";
}

export interface OpenDetailErrorEvent {
  message: string;
  type: "error";
}

export type OpenDetailStreamEvent =
  | OpenDetailMetaEvent
  | OpenDetailSourcesEvent
  | OpenDetailImagesEvent
  | OpenDetailDeltaEvent
  | OpenDetailDoneEvent
  | OpenDetailErrorEvent;

export type OpenDetailResponseCreateParamsNonStreaming =
  ResponseCreateParamsNonStreaming;
export type OpenDetailResponseCreateParamsStreaming =
  ResponseCreateParamsStreaming;
export type OpenDetailResponseObject = Response;
export type OpenDetailResponseStreamEvent = ResponseStreamEvent;
