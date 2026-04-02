import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { readOpenDetailConfig } from "./config";
import {
  BUILD_FILE_READ_CONCURRENCY,
  OPENDETAIL_INDEX_FILE,
  OPENDETAIL_VERSION,
} from "./constants";
import { OpenDetailConfigError } from "./errors";
import { createRelativeChunkPath, extractMarkdownChunks } from "./markdown";
import type {
  BuildOpenDetailIndexOptions,
  BuildOpenDetailIndexResult,
  OpenDetailChunk,
  OpenDetailChunkImage,
  OpenDetailConfig,
} from "./types";
import {
  createManifestHash,
  getCommonDirectory,
  joinUrlPath,
  toPosixPath,
} from "./utils";

const HTTP_URL_REGEX = /^https?:\/\//iu;
const ABSOLUTE_URL_SCHEME_REGEX = /^[a-z][a-z\d+.-]*:/iu;
const PROTOCOL_RELATIVE_URL_REGEX = /^\/\//u;
const RESOURCE_URL_REGEX = /^(?<pathname>[^?#]*)(?<suffix>[?#].*)?$/u;

interface MatchedWorkspaceFile {
  filePath: string;
  realFilePath: string;
}

export const resolveIndexPath = (
  cwd: string,
  outputPath = OPENDETAIL_INDEX_FILE
): string => path.resolve(cwd, outputPath);

const isPathInsideDirectory = (
  directoryPath: string,
  targetPath: string
): boolean => {
  const relativePath = path.relative(directoryPath, targetPath);

  return (
    relativePath === "" ||
    !(relativePath.startsWith("..") || path.isAbsolute(relativePath))
  );
};

const mapWithConcurrencyLimit = async <TValue, TResult>(
  values: TValue[],
  concurrency: number,
  mapValue: (value: TValue, index: number) => Promise<TResult>
): Promise<TResult[]> => {
  const resolvedConcurrency = Math.max(1, Math.min(concurrency, values.length));
  const entries = values.map((value, index) => [index, value] as const);
  const results = new Array<TResult>(values.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < entries.length) {
      const currentEntry = entries[nextIndex];
      nextIndex += 1;

      if (!currentEntry) {
        continue;
      }

      const [currentIndex, value] = currentEntry;
      results[currentIndex] = await mapValue(value, currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: resolvedConcurrency }, () => worker())
  );

  return results;
};

const resolveMatchedWorkspaceFiles = async ({
  cwd,
  emptyMatchMessage,
  exclude,
  include,
  resolvedCwd,
}: {
  cwd: string;
  emptyMatchMessage?: string;
  exclude: string[];
  include: string[];
  resolvedCwd: string;
}): Promise<MatchedWorkspaceFile[]> => {
  const matchedFiles = await fg(include, {
    absolute: false,
    cwd,
    followSymbolicLinks: false,
    ignore: exclude,
    onlyFiles: true,
    unique: true,
  });
  const normalizedFiles = matchedFiles
    .map((filePath) => toPosixPath(filePath))
    .sort((left, right) => left.localeCompare(right));

  if (normalizedFiles.length === 0) {
    if (emptyMatchMessage) {
      throw new OpenDetailConfigError(emptyMatchMessage);
    }

    return [];
  }

  return mapWithConcurrencyLimit(
    normalizedFiles,
    BUILD_FILE_READ_CONCURRENCY,
    async (filePath) => {
      const absoluteFilePath = path.resolve(cwd, filePath);
      const realFilePath = await realpath(absoluteFilePath);

      if (!isPathInsideDirectory(resolvedCwd, realFilePath)) {
        throw new OpenDetailConfigError(
          `OpenDetail build matched a file outside the workspace root via symlink: ${filePath}`
        );
      }

      return {
        filePath,
        realFilePath,
      };
    }
  );
};

const createMediaLookup = ({
  config,
  cwd,
  mediaFiles,
}: {
  config: OpenDetailConfig;
  cwd: string;
  mediaFiles: MatchedWorkspaceFile[];
}): Map<string, string> => {
  if (!config.media || mediaFiles.length === 0) {
    return new Map<string, string>();
  }

  const commonRoot = getCommonDirectory(
    mediaFiles.map((file) => file.filePath)
  );
  const mediaLookup = new Map<string, string>();

  for (const mediaFile of mediaFiles) {
    const relativeMediaPath = createRelativeChunkPath(
      commonRoot,
      mediaFile.filePath
    );
    const publicUrl = joinUrlPath(config.media.base_path, relativeMediaPath);

    mediaLookup.set(mediaFile.realFilePath, publicUrl);
    mediaLookup.set(path.resolve(cwd, mediaFile.filePath), publicUrl);
  }

  return mediaLookup;
};

const createMediaManifestEntries = ({
  cwd,
  mediaFiles,
  mediaLookup,
}: {
  cwd: string;
  mediaFiles: MatchedWorkspaceFile[];
  mediaLookup: Map<string, string>;
}): Array<{ filePath: string; url: string }> =>
  mediaFiles.map((mediaFile) => ({
    filePath: mediaFile.filePath,
    url:
      mediaLookup.get(mediaFile.realFilePath) ??
      mediaLookup.get(path.resolve(cwd, mediaFile.filePath)) ??
      "",
  }));

const splitResourceUrl = (
  value: string
): {
  pathname: string;
  suffix: string;
} => {
  const matchedResourceUrl = RESOURCE_URL_REGEX.exec(value);

  return {
    pathname: matchedResourceUrl?.groups?.pathname ?? value,
    suffix: matchedResourceUrl?.groups?.suffix ?? "",
  };
};

const isRootRelativeUrl = (value: string): boolean =>
  value.startsWith("/") && !PROTOCOL_RELATIVE_URL_REGEX.test(value);

const isUnsupportedAbsoluteUrl = (value: string): boolean =>
  PROTOCOL_RELATIVE_URL_REGEX.test(value) ||
  ABSOLUTE_URL_SCHEME_REGEX.test(value);

const createImageResolver = ({
  config,
  mediaLookup,
  relativePath,
  sourceFilePath,
}: {
  config: OpenDetailConfig;
  mediaLookup: Map<string, string>;
  relativePath: string;
  sourceFilePath: string;
}): ((image: OpenDetailChunkImage) => OpenDetailChunkImage | null) => {
  return (image) => {
    if (HTTP_URL_REGEX.test(image.url) || isRootRelativeUrl(image.url)) {
      return image;
    }

    if (isUnsupportedAbsoluteUrl(image.url)) {
      return null;
    }

    if (!config.media) {
      return null;
    }

    const { pathname, suffix } = splitResourceUrl(image.url);
    const resolvedImagePath = path.resolve(
      path.dirname(sourceFilePath),
      pathname
    );
    const mappedUrl = mediaLookup.get(resolvedImagePath);

    if (!mappedUrl) {
      throw new OpenDetailConfigError(
        `OpenDetail found a local image reference \`${image.url}\` in \`${relativePath}\`, but it does not resolve to a file matched by \`[media].include\` and \`[media].exclude\`.`
      );
    }

    return {
      ...image,
      url: `${mappedUrl}${suffix}`,
    };
  };
};

export const buildOpenDetailIndex = async ({
  configPath,
  cwd = process.cwd(),
  outputPath,
}: BuildOpenDetailIndexOptions = {}): Promise<BuildOpenDetailIndexResult> => {
  const config = await readOpenDetailConfig({ configPath, cwd });
  const resolvedCwd = await realpath(cwd);
  const contentFiles = await resolveMatchedWorkspaceFiles({
    cwd,
    emptyMatchMessage:
      "OpenDetail build matched no files. Check the include and exclude globs in opendetail.toml.",
    exclude: config.exclude,
    include: config.include,
    resolvedCwd,
  });
  const mediaFiles = config.media
    ? await resolveMatchedWorkspaceFiles({
        cwd,
        exclude: config.media.exclude,
        include: config.media.include,
        resolvedCwd,
      })
    : [];
  const mediaLookup = createMediaLookup({
    config,
    cwd,
    mediaFiles,
  });
  const commonRoot = getCommonDirectory(
    contentFiles.map((file) => file.filePath)
  );
  const chunkGroups = await mapWithConcurrencyLimit(
    contentFiles,
    BUILD_FILE_READ_CONCURRENCY,
    async ({ filePath, realFilePath }) => {
      const fileContent = await readFile(realFilePath, "utf8");
      const relativePath = createRelativeChunkPath(commonRoot, filePath);

      return {
        chunks: extractMarkdownChunks({
          config,
          fileContent,
          filePath: realFilePath,
          relativePath,
          resolveImage: createImageResolver({
            config,
            mediaLookup,
            relativePath,
            sourceFilePath: realFilePath,
          }),
        }),
        contentHash: createManifestHash(fileContent),
        filePath,
      };
    }
  );
  const chunks = chunkGroups.flatMap((group) => group.chunks);
  const resolvedOutputPath = resolveIndexPath(cwd, outputPath);
  const artifact = {
    chunks,
    config,
    generatedAt: new Date().toISOString(),
    manifestHash: createManifestHash(
      JSON.stringify({
        config,
        files: chunkGroups.map((group) => ({
          chunks: group.chunks.map((chunk) => ({
            id: chunk.id,
            images: (chunk.images ?? []).map((image) => image.url),
            url: chunk.url,
          })),
          contentHash: group.contentHash,
          filePath: group.filePath,
        })),
        media: createMediaManifestEntries({
          cwd,
          mediaFiles,
          mediaLookup,
        }),
      })
    ),
    version: OPENDETAIL_VERSION,
  } as const;

  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(artifact, null, 2)}\n`);

  return {
    artifact: {
      ...artifact,
      chunks: chunks as OpenDetailChunk[],
    },
    outputPath: resolvedOutputPath,
  };
};
