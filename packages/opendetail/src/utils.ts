import { createHash } from "node:crypto";
import path from "node:path";

const TRAILING_SLASHES_REGEX = /\/+$/u;
const MARKDOWN_EXTENSION_REGEX = /\.(md|mdx)$/iu;
const TRAILING_INDEX_REGEX = /\/index$/iu;

export const toPosixPath = (value: string): string =>
  value.split(path.sep).join(path.posix.sep);

export const normalizeBasePath = (value: string): string => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0 || trimmedValue === "/") {
    return "/";
  }

  const withLeadingSlash = trimmedValue.startsWith("/")
    ? trimmedValue
    : `/${trimmedValue}`;

  return withLeadingSlash.replace(TRAILING_SLASHES_REGEX, "");
};

export const joinUrlPath = (basePath: string, relativePath: string): string => {
  const segments = [basePath, relativePath]
    .filter((segment) => segment.length > 0 && segment !== "/")
    .flatMap((segment) => segment.split("/"))
    .filter(Boolean);

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
};

export const stripMarkdownExtension = (value: string): string =>
  value.replace(MARKDOWN_EXTENSION_REGEX, "");

export const stripTrailingIndex = (value: string): string => {
  if (value === "index") {
    return "";
  }

  return value.replace(TRAILING_INDEX_REGEX, "");
};

export const createManifestHash = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
};

export const ensureTrailingNewline = (value: string): string =>
  value.endsWith("\n") ? value : `${value}\n`;

/** Stable path segment for chunk IDs (typically repo-relative to the build `cwd`), unique across include groups. */
export const createChunkId = (
  chunkIdPath: string,
  anchor: string | null,
  partIndex: number
): string => {
  const baseId = anchor ? `${chunkIdPath}#${anchor}` : chunkIdPath;

  return partIndex === 0 ? baseId : `${baseId}::part-${partIndex + 1}`;
};

export const getCommonDirectory = (filePaths: string[]): string => {
  if (filePaths.length === 0) {
    return "";
  }

  const directorySegments = filePaths.map((filePath) => {
    const directory = path.posix.dirname(toPosixPath(filePath));

    return directory === "." ? [] : directory.split("/");
  });

  const [firstDirectory = [], ...otherDirectories] = directorySegments;
  const commonSegments = [...firstDirectory];

  for (const directory of otherDirectories) {
    let segmentIndex = 0;

    while (
      segmentIndex < commonSegments.length &&
      segmentIndex < directory.length &&
      commonSegments[segmentIndex] === directory[segmentIndex]
    ) {
      segmentIndex += 1;
    }

    commonSegments.length = segmentIndex;
  }

  return commonSegments.join("/");
};

export const uniqueBy = <TValue, TKey>(
  values: TValue[],
  getKey: (value: TValue) => TKey
): TValue[] => {
  const seenKeys = new Set<TKey>();
  const uniqueValues: TValue[] = [];

  for (const value of values) {
    const key = getKey(value);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    uniqueValues.push(value);
  }

  return uniqueValues;
};
