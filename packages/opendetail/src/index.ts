import { buildOpenDetailIndex as buildOpenDetailIndexImplementation } from "./build";
import { createOpenDetail as createOpenDetailImplementation } from "./runtime";

export const buildOpenDetailIndex = buildOpenDetailIndexImplementation;
export const createOpenDetail = createOpenDetailImplementation;
export type {
  BuildOpenDetailIndexOptions,
  BuildOpenDetailIndexResult,
  CreateOpenDetailOptions,
  OpenDetailAnswerInput,
  OpenDetailAnswerResult,
  OpenDetailAssistant,
  OpenDetailChunk,
  OpenDetailChunkImage,
  OpenDetailConfig,
  OpenDetailDoneEvent,
  OpenDetailErrorCode,
  OpenDetailErrorEvent,
  OpenDetailImage,
  OpenDetailImagesEvent,
  OpenDetailIndexArtifact,
  OpenDetailMediaConfig,
  OpenDetailMetaEvent,
  OpenDetailPublicError,
  OpenDetailSource,
  OpenDetailSourcesEvent,
  OpenDetailStreamEvent,
  OpenDetailStreamResult,
} from "./types";
