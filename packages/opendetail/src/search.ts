import MiniSearch from "minisearch";
import { z } from "zod";
import { DEFAULT_MAX_RETRIEVED_CHUNKS, OPENDETAIL_VERSION } from "./constants";
import type { OpenDetailChunk, OpenDetailIndexArtifact } from "./types";
import { uniqueBy } from "./utils";

interface SearchableChunk extends OpenDetailChunk {
  searchHeadings: string;
}

const OpenDetailChunkSchema = z.object({
  anchor: z.string().nullable(),
  filePath: z.string(),
  headings: z.array(z.string()),
  id: z.string(),
  relativePath: z.string(),
  text: z.string(),
  title: z.string(),
  url: z.string(),
});

const OpenDetailConfigSchema = z.object({
  base_path: z.string(),
  exclude: z.array(z.string()),
  include: z.array(z.string()),
  version: z.literal(OPENDETAIL_VERSION),
});

const OpenDetailIndexArtifactSchema = z.object({
  chunks: z.array(OpenDetailChunkSchema),
  config: OpenDetailConfigSchema,
  generatedAt: z.string(),
  manifestHash: z.string(),
  version: z.literal(OPENDETAIL_VERSION),
});

const extractSearchField = (
  document: SearchableChunk,
  fieldName: string
): string => {
  const fieldValue =
    document[fieldName as keyof SearchableChunk] ??
    document[fieldName as "headings"];

  if (Array.isArray(fieldValue)) {
    return fieldValue.join(" ");
  }

  return typeof fieldValue === "string" ? fieldValue : "";
};

export const parseOpenDetailIndexArtifact = (
  value: unknown
): OpenDetailIndexArtifact => OpenDetailIndexArtifactSchema.parse(value);

export const createMiniSearchIndex = (
  chunks: OpenDetailChunk[]
): MiniSearch<SearchableChunk> => {
  const miniSearch = new MiniSearch<SearchableChunk>({
    extractField: extractSearchField,
    fields: ["title", "searchHeadings", "text", "relativePath"],
    storeFields: ["id", "url", "title", "headings", "text", "filePath"],
  });

  miniSearch.addAll(
    chunks.map((chunk) => ({
      ...chunk,
      searchHeadings: chunk.headings.join(" "),
    }))
  );
  return miniSearch;
};

export const retrieveRelevantChunks = (
  miniSearch: MiniSearch<SearchableChunk>,
  question: string
): OpenDetailChunk[] => {
  const results = miniSearch.search(question, {
    boost: {
      relativePath: 2,
      searchHeadings: 3,
      text: 1,
      title: 4,
    },
    prefix: true,
  });

  return uniqueBy(
    results.slice(0, DEFAULT_MAX_RETRIEVED_CHUNKS).map((result) => ({
      anchor: result.anchor,
      filePath: result.filePath,
      headings: Array.isArray(result.headings)
        ? result.headings
        : [String(result.headings)],
      id: result.id,
      relativePath: result.relativePath,
      text: result.text,
      title: result.title,
      url: result.url,
    })),
    (chunk) => chunk.id
  );
};
