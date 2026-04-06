import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { getUrlPathname } from "./site-pages";
import type { OpenDetailChunk, OpenDetailChunkImage } from "./types";

const KnowledgeAssetSchema = z
  .object({
    path: z.string().min(1).optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    title: z.string().optional(),
    url: z.string().min(1).optional(),
  })
  .strict()
  .refine((data) => data.path !== undefined || data.url !== undefined, {
    message: "Each [[asset]] must include `path` or `url`.",
  });

const KnowledgeFileSchema = z
  .object({
    asset: z.array(KnowledgeAssetSchema).min(1),
  })
  .strict();

export type KnowledgeSidecarLookup = Map<
  string,
  { summary?: string; title?: string }
>;

const normalizeLookupKey = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.startsWith("/")) {
    return getUrlPathname(trimmed);
  }

  return trimmed;
};

export const loadKnowledgeSidecarLookup = (
  cwd: string,
  knowledgePath: string
): KnowledgeSidecarLookup => {
  const resolved = path.resolve(cwd, knowledgePath);

  if (!existsSync(resolved)) {
    return new Map();
  }

  let parsed: unknown;

  try {
    parsed = parseToml(readFileSync(resolved, "utf8"));
  } catch {
    return new Map();
  }

  const validated = KnowledgeFileSchema.safeParse(parsed);

  if (!validated.success) {
    return new Map();
  }

  const lookup: KnowledgeSidecarLookup = new Map();

  for (const entry of validated.data.asset) {
    const meta = {
      summary: entry.summary,
      title: entry.title,
    };

    if (entry.url) {
      lookup.set(normalizeLookupKey(entry.url), meta);
    }

    if (entry.path) {
      lookup.set(normalizeLookupKey(entry.path), meta);
    }
  }

  return lookup;
};

const mergeImage = (
  image: OpenDetailChunkImage,
  lookup: KnowledgeSidecarLookup
): OpenDetailChunkImage => {
  const byUrl = lookup.get(normalizeLookupKey(image.url));
  const merged = { ...image };

  if (byUrl?.title) {
    merged.knowledgeTitle = byUrl.title;
  }

  if (byUrl?.summary) {
    merged.knowledgeSummary = byUrl.summary;
  }

  return merged;
};

export const applyKnowledgeSidecarToChunks = (
  chunks: OpenDetailChunk[],
  lookup: KnowledgeSidecarLookup
): OpenDetailChunk[] => {
  if (lookup.size === 0) {
    return chunks;
  }

  return chunks.map((chunk) => {
    if (!chunk.images?.length) {
      return chunk;
    }

    return {
      ...chunk,
      images: chunk.images.map((image) => mergeImage(image, lookup)),
    };
  });
};
