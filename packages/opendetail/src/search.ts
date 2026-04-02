import MiniSearch from "minisearch";
import { z } from "zod";
import { DEFAULT_MAX_RETRIEVED_CHUNKS, OPENDETAIL_VERSION } from "./constants";
import type {
  OpenDetailChunk,
  OpenDetailChunkImage,
  OpenDetailIndexArtifact,
} from "./types";
import { uniqueBy } from "./utils";

interface SearchableChunk extends OpenDetailChunk {
  searchHeadings: string;
  searchImages: string;
  storedHeadings: string;
  storedImages: string;
}

const OpenDetailChunkImageSchema = z.object({
  alt: z.string().nullable(),
  title: z.string().nullable(),
  url: z.string(),
});

const OpenDetailChunkSchema = z.object({
  anchor: z.string().nullable(),
  filePath: z.string(),
  headings: z.array(z.string()),
  id: z.string(),
  images: z.array(OpenDetailChunkImageSchema).default([]),
  relativePath: z.string(),
  text: z.string(),
  title: z.string(),
  url: z.string(),
});

const OpenDetailConfigSchema = z.object({
  base_path: z.string(),
  exclude: z.array(z.string()),
  include: z.array(z.string()),
  media: z
    .object({
      base_path: z.string(),
      exclude: z.array(z.string()),
      include: z.array(z.string()),
    })
    .optional(),
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

const createSearchableImageText = (images: OpenDetailChunk["images"]): string =>
  (images ?? [])
    .flatMap((image) => [image.alt ?? "", image.title ?? ""])
    .filter((value) => value.length > 0)
    .join(" ");

const parseStoredHeadings = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsedHeadings = z.array(z.string()).safeParse(JSON.parse(value));

    return parsedHeadings.success ? parsedHeadings.data : [];
  } catch {
    return [];
  }
};

const parseStoredImages = (value: unknown): OpenDetailChunkImage[] => {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsedImages = z
      .array(OpenDetailChunkImageSchema)
      .safeParse(JSON.parse(value));

    return parsedImages.success ? parsedImages.data : [];
  } catch {
    return [];
  }
};

export const createMiniSearchIndex = (
  chunks: OpenDetailChunk[]
): MiniSearch<SearchableChunk> => {
  const miniSearch = new MiniSearch<SearchableChunk>({
    extractField: extractSearchField,
    fields: ["title", "searchHeadings", "searchImages", "text", "relativePath"],
    storeFields: [
      "filePath",
      "id",
      "relativePath",
      "storedHeadings",
      "storedImages",
      "text",
      "title",
      "url",
    ],
  });

  miniSearch.addAll(
    chunks.map((chunk) => ({
      ...chunk,
      searchHeadings: chunk.headings.join(" "),
      searchImages: createSearchableImageText(chunk.images),
      storedHeadings: JSON.stringify(chunk.headings),
      storedImages: JSON.stringify(chunk.images ?? []),
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
      searchImages: 2,
      text: 1,
      title: 4,
    },
    prefix: true,
  });

  return uniqueBy(
    results.slice(0, DEFAULT_MAX_RETRIEVED_CHUNKS).map((result) => ({
      anchor: result.anchor,
      filePath: result.filePath,
      headings: parseStoredHeadings(result.storedHeadings),
      id: result.id,
      images: parseStoredImages(result.storedImages),
      relativePath: result.relativePath,
      text: result.text,
      title: result.title,
      url: result.url,
    })),
    (chunk) => chunk.id
  );
};
