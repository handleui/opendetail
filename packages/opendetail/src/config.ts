import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { OPENDETAIL_CONFIG_FILE, OPENDETAIL_VERSION } from "./constants";
import { OpenDetailConfigError } from "./errors";
import type { OpenDetailConfig } from "./types";
import { normalizePublicPath } from "./utils";

const ContentRootSchema = z
  .object({
    exclude: z.array(z.string()).default([]),
    include: z.array(z.string()).min(1),
    public_path: z.string(),
  })
  .strict();

const FetchSchema = z
  .object({
    file_search: z
      .object({
        max_num_results: z.number().int().min(1).max(50).optional(),
        vector_store_ids: z.array(z.string().min(1)).min(1),
      })
      .strict()
      .optional(),
    web_search: z
      .object({
        allowed_domains: z.array(z.string().min(1)).min(1).optional(),
        search_context_size: z.enum(["low", "medium", "high"]).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .optional();

const OpenDetailConfigSchema = z
  .object({
    content: z.array(ContentRootSchema).min(1),
    fetch: FetchSchema,
    knowledge: z.string().min(1).optional(),
    media: z
      .object({
        exclude: z.array(z.string()).default([]),
        include: z.array(z.string()).min(1),
        public_path: z.string(),
      })
      .strict()
      .optional(),
    model: z.string().min(1).optional(),
    version: z.literal(OPENDETAIL_VERSION),
  })
  .strict();

export const resolveConfigPath = (
  cwd: string,
  configPath = OPENDETAIL_CONFIG_FILE
): string => path.resolve(cwd, configPath);

export const readOpenDetailConfig = async ({
  configPath,
  cwd = ".",
}: {
  configPath?: string;
  cwd?: string;
} = {}): Promise<OpenDetailConfig> => {
  const resolvedConfigPath = resolveConfigPath(cwd, configPath);
  let configFile: string;

  try {
    configFile = await readFile(resolvedConfigPath, "utf8");
  } catch (error) {
    throw new OpenDetailConfigError(
      `OpenDetail config not found at ${resolvedConfigPath}. Add \`${OPENDETAIL_CONFIG_FILE}\` before building the index.`,
      { cause: error }
    );
  }

  let parsedConfig: unknown;

  try {
    parsedConfig = parseToml(configFile);
  } catch (error) {
    throw new OpenDetailConfigError(
      `Failed to parse ${resolvedConfigPath} as TOML.`,
      { cause: error }
    );
  }

  const validationResult = OpenDetailConfigSchema.safeParse(parsedConfig);

  if (!validationResult.success) {
    throw new OpenDetailConfigError(
      `Invalid OpenDetail config in ${resolvedConfigPath}: ${z.prettifyError(validationResult.error)}`
    );
  }

  const { media, ...config } = validationResult.data;

  return {
    ...config,
    content: config.content.map((root) => ({
      ...root,
      public_path: normalizePublicPath(root.public_path),
    })),
    ...(media
      ? {
          media: {
            ...media,
            public_path: normalizePublicPath(media.public_path),
          },
        }
      : {}),
  } as OpenDetailConfig;
};
