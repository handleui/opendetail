#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import readline from "node:readline/promises";
import { buildOpenDetailIndex } from "./build";
import { OPENDETAIL_CONFIG_FILE, OPENDETAIL_INDEX_FILE } from "./constants";
import { getErrorMessage } from "./utils";

const DEFAULT_ROUTE_PATH = "src/app/api/opendetail/route.ts";
const DEFAULT_DOCS_INCLUDE_PATTERN = "content/**/*.{md,mdx}";
const DEFAULT_MEDIA_INCLUDE_PATTERN =
  "content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}";

type CliLogger = Pick<typeof console, "error" | "log">;

interface CliContext {
  logger: CliLogger;
}

interface SetupAnswers {
  basePath: string;
  includePattern: string;
  mediaIncludePattern: string;
  routePath: string;
  shouldBuild: boolean;
  withMedia: boolean;
}

interface ParsedCliArgs {
  command: string | null;
  flags: Map<string, string | true>;
}

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version?: string };
const CLI_VERSION =
  typeof packageJson.version === "string" ? packageJson.version : "0.0.0";

const printCliHeader = (logger: CliLogger): void => {
  logger.log(`Opendetail v${CLI_VERSION}\n`);
};

const parseCliArgs = (argv: string[]): ParsedCliArgs => {
  const [command, ...rawFlags] = argv;
  const flags = new Map<string, string | true>();

  for (let index = 0; index < rawFlags.length; index += 1) {
    const token = rawFlags[index];

    if (!token?.startsWith("--")) {
      continue;
    }

    const normalizedToken = token.slice(2);

    if (normalizedToken.length === 0) {
      continue;
    }

    if (normalizedToken.includes("=")) {
      const [name, ...parts] = normalizedToken.split("=");
      const value = parts.join("=");

      if (name) {
        flags.set(name, value);
      }

      continue;
    }

    const nextToken = rawFlags[index + 1];
    const hasValue =
      typeof nextToken === "string" &&
      nextToken.length > 0 &&
      !nextToken.startsWith("--");

    if (hasValue) {
      flags.set(normalizedToken, nextToken);
      index += 1;
      continue;
    }

    flags.set(normalizedToken, true);
  }

  return {
    command: command ?? null,
    flags,
  };
};

const resolveStringFlag = (
  flags: Map<string, string | true>,
  name: string
): string | null => {
  const value = flags.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

const printUsage = (): void => {
  console.log(`Usage:
  opendetail build [--config <path>] [--output <path>] [--cwd <path>]
  opendetail setup [--config <path>] [--route <path>] [--base-path <url>] [--include <glob>] [--media-include <glob>] [--with-media] [--skip-build] [--force] [--interactive] [--no-interactive] [--cwd <path>]
  opendetail doctor [--config <path>] [--route <path>] [--cwd <path>]

Examples:
  bunx opendetail setup
  bunx opendetail setup --with-media
  bunx opendetail setup --route src/app/api/assistant/route.ts --base-path /help
  bunx opendetail doctor
  opendetail build`);
};

const askQuestion = async ({
  defaultValue,
  prompt,
  rl,
}: {
  defaultValue: string;
  prompt: string;
  rl: readline.Interface;
}): Promise<string> => {
  const answer = await rl.question(`${prompt} (${defaultValue}): `);
  const trimmedAnswer = answer.trim();

  return trimmedAnswer.length > 0 ? trimmedAnswer : defaultValue;
};

const askYesNoQuestion = async ({
  defaultValue,
  prompt,
  rl,
}: {
  defaultValue: boolean;
  prompt: string;
  rl: readline.Interface;
}): Promise<boolean> => {
  const defaultLabel = defaultValue ? "Y/n" : "y/N";
  const answer = await rl.question(`${prompt} (${defaultLabel}): `);
  const normalizedAnswer = answer.trim().toLowerCase();

  if (normalizedAnswer.length === 0) {
    return defaultValue;
  }

  return normalizedAnswer === "y" || normalizedAnswer === "yes";
};

const shouldRunInteractiveSetup = (
  flags: Map<string, string | true>
): boolean => {
  if (flags.has("interactive")) {
    return true;
  }

  if (flags.has("no-interactive")) {
    return false;
  }

  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
};

const promptSetupAnswers = async ({
  basePath,
  defaultShouldBuild,
  includePattern,
  logger,
  mediaIncludePattern,
  routePath,
  withMedia,
}: {
  basePath: string;
  defaultShouldBuild: boolean;
  includePattern: string;
  logger: CliLogger;
  mediaIncludePattern: string;
  routePath: string;
  withMedia: boolean;
}): Promise<SetupAnswers> => {
  logger.log("Setup wizard\n");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    logger.log("Step 1/5 · Content");
    const resolvedIncludePattern = await askQuestion({
      defaultValue: includePattern,
      prompt: "Docs include glob",
      rl,
    });
    const resolvedBasePath = await askQuestion({
      defaultValue: basePath,
      prompt: "Public base path for generated source URLs",
      rl,
    });

    logger.log("\nStep 2/5 · Media");
    const resolvedWithMedia = await askYesNoQuestion({
      defaultValue: withMedia,
      prompt: "Enable local media mapping",
      rl,
    });
    const resolvedMediaIncludePattern = resolvedWithMedia
      ? await askQuestion({
          defaultValue: mediaIncludePattern,
          prompt: "Media include glob",
          rl,
        })
      : mediaIncludePattern;

    logger.log("\nStep 3/5 · Route");
    const resolvedRoutePath = await askQuestion({
      defaultValue: routePath,
      prompt: "Next.js route file path",
      rl,
    });

    logger.log("\nStep 4/5 · Build");
    const resolvedShouldBuild = await askYesNoQuestion({
      defaultValue: defaultShouldBuild,
      prompt: "Build index after scaffolding",
      rl,
    });

    logger.log("\nStep 5/5 · Confirmed");
    return {
      basePath: resolvedBasePath,
      includePattern: resolvedIncludePattern,
      mediaIncludePattern: resolvedMediaIncludePattern,
      routePath: resolvedRoutePath,
      shouldBuild: resolvedShouldBuild,
      withMedia: resolvedWithMedia,
    };
  } finally {
    rl.close();
  }
};

const createConfigTemplate = ({
  basePath,
  includePattern,
  mediaIncludePattern,
  withMedia,
}: {
  basePath: string;
  includePattern: string;
  mediaIncludePattern: string;
  withMedia: boolean;
}): string =>
  `version = 1
include = ["${includePattern}"]
exclude = []
base_path = "${basePath}"
${
  withMedia
    ? `
[media]
include = ["${mediaIncludePattern}"]
exclude = []
base_path = "/content-media"`
    : ""
}
`;

const createNextRouteTemplate = (): string =>
  `import { createNextRoute } from "opendetail/next";

export const { POST, runtime } = createNextRoute();
`;

const handleBuildCommand = async ({
  cwd,
  flags,
  logger,
}: {
  cwd: string;
  flags: Map<string, string | true>;
  logger: CliLogger;
}): Promise<void> => {
  const { artifact, outputPath } = await buildOpenDetailIndex({
    configPath: resolveStringFlag(flags, "config") ?? undefined,
    cwd,
    outputPath: resolveStringFlag(flags, "output") ?? undefined,
  });

  logger.log(
    `Built OpenDetail index with ${artifact.chunks.length} chunk${artifact.chunks.length === 1 ? "" : "s"} at ${outputPath}`
  );
};

const writeIfMissing = async ({
  content,
  filePath,
  force,
}: {
  content: string;
  filePath: string;
  force: boolean;
}): Promise<"created" | "skipped" | "updated"> => {
  try {
    await readFile(filePath, "utf8");

    if (!force) {
      return "skipped";
    }

    await writeFile(filePath, content, "utf8");
    return "updated";
  } catch {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
    return "created";
  }
};

const handleSetupCommand = async ({
  cwd,
  flags,
  logger,
}: {
  cwd: string;
  flags: Map<string, string | true>;
  logger: CliLogger;
}): Promise<void> => {
  const configPath = path.resolve(
    cwd,
    resolveStringFlag(flags, "config") ?? OPENDETAIL_CONFIG_FILE
  );
  const includePattern =
    resolveStringFlag(flags, "include") ?? DEFAULT_DOCS_INCLUDE_PATTERN;
  const mediaIncludePattern =
    resolveStringFlag(flags, "media-include") ?? DEFAULT_MEDIA_INCLUDE_PATTERN;
  const withMedia =
    flags.has("with-media") ||
    Boolean(resolveStringFlag(flags, "media-include"));
  const force = flags.has("force");
  const skipBuild = flags.has("skip-build");
  const basePath = resolveStringFlag(flags, "base-path") ?? "/docs";
  const routePathValue =
    resolveStringFlag(flags, "route") ?? DEFAULT_ROUTE_PATH;

  const setupAnswers = shouldRunInteractiveSetup(flags)
    ? await promptSetupAnswers({
        basePath,
        defaultShouldBuild: !skipBuild,
        includePattern,
        logger,
        mediaIncludePattern,
        routePath: routePathValue,
        withMedia,
      })
    : {
        basePath,
        includePattern,
        mediaIncludePattern,
        routePath: routePathValue,
        shouldBuild: !skipBuild,
        withMedia,
      };

  const configResult = await writeIfMissing({
    content: createConfigTemplate({
      basePath: setupAnswers.basePath,
      includePattern: setupAnswers.includePattern,
      mediaIncludePattern: setupAnswers.mediaIncludePattern,
      withMedia: setupAnswers.withMedia,
    }),
    filePath: configPath,
    force,
  });
  const routeResult = await writeIfMissing({
    content: createNextRouteTemplate(),
    filePath: path.resolve(cwd, setupAnswers.routePath),
    force,
  });

  logger.log(
    `${configResult === "skipped" ? "Skipped" : "Wrote"} ${path.relative(cwd, configPath)}`
  );
  logger.log(
    `${routeResult === "skipped" ? "Skipped" : "Wrote"} ${path.relative(cwd, path.resolve(cwd, setupAnswers.routePath))}`
  );

  if (setupAnswers.shouldBuild) {
    await handleBuildCommand({ cwd, flags, logger });
  } else {
    logger.log("Skipped index build (--skip-build).");
  }

  logger.log("Setup complete. Set OPENAI_API_KEY in your runtime environment.");
};

const checkPath = async (value: string): Promise<boolean> => {
  try {
    await readFile(value, "utf8");
    return true;
  } catch {
    return false;
  }
};

const handleDoctorCommand = async ({
  cwd,
  flags,
  logger,
}: {
  cwd: string;
  flags: Map<string, string | true>;
  logger: CliLogger;
}): Promise<void> => {
  const configPath = path.resolve(
    cwd,
    resolveStringFlag(flags, "config") ?? OPENDETAIL_CONFIG_FILE
  );
  const routePath = path.resolve(
    cwd,
    resolveStringFlag(flags, "route") ?? DEFAULT_ROUTE_PATH
  );
  const indexPath = path.resolve(cwd, OPENDETAIL_INDEX_FILE);
  const checks = [
    {
      exists: await checkPath(configPath),
      label: "Config",
      message: path.relative(cwd, configPath),
    },
    {
      exists: await checkPath(indexPath),
      label: "Index",
      message: path.relative(cwd, indexPath),
    },
    {
      exists: await checkPath(routePath),
      label: "Route",
      message: path.relative(cwd, routePath),
    },
    {
      exists:
        typeof process.env.OPENAI_API_KEY === "string" &&
        process.env.OPENAI_API_KEY.trim().length > 0,
      label: "Env",
      message: "OPENAI_API_KEY",
    },
  ];
  let hasFailure = false;

  for (const check of checks) {
    const prefix = check.exists ? "✓" : "✗";

    if (!check.exists) {
      hasFailure = true;
    }

    logger.log(`${prefix} ${check.label}: ${check.message}`);
  }

  if (hasFailure) {
    throw new Error("OpenDetail doctor found setup issues.");
  }
};

export const runCli = async (
  argv: string[],
  context: CliContext = { logger: console }
): Promise<void> => {
  const { command, flags } = parseCliArgs(argv);
  const cwd = path.resolve(resolveStringFlag(flags, "cwd") ?? process.cwd());
  printCliHeader(context.logger);

  if (!command) {
    printUsage();
    throw new Error("Missing command.");
  }

  if (command === "build") {
    await handleBuildCommand({
      cwd,
      flags,
      logger: context.logger,
    });
    return;
  }

  if (command === "setup") {
    await handleSetupCommand({
      cwd,
      flags,
      logger: context.logger,
    });
    return;
  }

  if (command === "doctor") {
    await handleDoctorCommand({
      cwd,
      flags,
      logger: context.logger,
    });
    return;
  }

  context.logger.error(`Unknown command: ${command}`);
  printUsage();
  throw new Error(`Unknown command: ${command}`);
};

runCli(process.argv.slice(2)).catch((error: unknown) => {
  console.error(getErrorMessage(error));
  process.exitCode = 1;
});
