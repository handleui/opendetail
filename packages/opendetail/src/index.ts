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
  OpenDetailConfig,
  OpenDetailDoneEvent,
  OpenDetailErrorEvent,
  OpenDetailIndexArtifact,
  OpenDetailMetaEvent,
  OpenDetailSource,
  OpenDetailSourcesEvent,
  OpenDetailStreamEvent,
  OpenDetailStreamResult,
} from "./types";
