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
} from "./types";
import { createManifestHash, getCommonDirectory, toPosixPath } from "./utils";

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

export const buildOpenDetailIndex = async ({
  configPath,
  cwd = process.cwd(),
  outputPath,
}: BuildOpenDetailIndexOptions = {}): Promise<BuildOpenDetailIndexResult> => {
  const config = await readOpenDetailConfig({ configPath, cwd });
  const matchedFiles = await fg(config.include, {
    absolute: false,
    cwd,
    followSymbolicLinks: false,
    ignore: config.exclude,
    onlyFiles: true,
    unique: true,
  });
  const normalizedFiles = matchedFiles
    .map((filePath) => toPosixPath(filePath))
    .sort((left, right) => left.localeCompare(right));

  if (normalizedFiles.length === 0) {
    throw new OpenDetailConfigError(
      "OpenDetail build matched no files. Check the include and exclude globs in opendetail.toml."
    );
  }

  const commonRoot = getCommonDirectory(normalizedFiles);
  const resolvedCwd = await realpath(cwd);
  const chunkGroups = await mapWithConcurrencyLimit(
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

      const fileContent = await readFile(realFilePath, "utf8");
      const relativePath = createRelativeChunkPath(commonRoot, filePath);

      return {
        chunks: extractMarkdownChunks({
          config,
          fileContent,
          filePath: realFilePath,
          relativePath,
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
          chunks: group.chunks.map((chunk) => chunk.id),
          contentHash: group.contentHash,
          filePath: group.filePath,
        })),
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
