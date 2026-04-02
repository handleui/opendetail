#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { buildOpenDetailIndex } from "./build";
import { OPENDETAIL_CONFIG_FILE, OPENDETAIL_INDEX_FILE } from "./constants";
import type { OpenDetailIntegrationMode } from "./types";
import { getErrorMessage } from "./utils";

const DEFAULT_ROUTE_PATH = "src/app/api/opendetail/route.ts";
const DEFAULT_DOCS_INCLUDE_PATTERN = "content/**/*.{md,mdx}";
const DEFAULT_MEDIA_INCLUDE_PATTERN =
  "content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}";
const DEFAULT_INTEGRATION_MODE =
  "self-hosted" satisfies OpenDetailIntegrationMode;
const HOSTED_ENDPOINT_ENV_VAR = "OPENDETAIL_ENDPOINT";

type CliLogger = Pick<typeof console, "error" | "log">;

interface CliContext {
  logger: CliLogger;
}

interface SetupAnswers {
  basePath: string;
  includePattern: string;
  integrationMode: OpenDetailIntegrationMode;
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

const pathExists = async (value: string): Promise<boolean> => {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
};

const hasNonEmptyEnvValue = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

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
  opendetail setup [--integration <self-hosted|hosted>] [--config <path>] [--route <path>] [--base-path <url>] [--include <glob>] [--media-include <glob>] [--with-media] [--skip-build] [--force] [--interactive] [--no-interactive] [--cwd <path>]
  opendetail doctor [--integration <self-hosted|hosted>] [--config <path>] [--route <path>] [--cwd <path>]

Examples:
  bunx opendetail setup
  bunx opendetail setup --integration hosted
  bunx opendetail setup --with-media
  bunx opendetail setup --route src/app/api/assistant/route.ts --base-path /help
  bunx opendetail doctor --integration hosted
  bunx opendetail doctor
  opendetail build`);
};

const parseIntegrationMode = (
  value: string | null
): OpenDetailIntegrationMode => {
  if (!value) {
    return DEFAULT_INTEGRATION_MODE;
  }

  if (value === "hosted" || value === "self-hosted") {
    return value;
  }

  throw new Error(
    `Invalid integration mode: ${value}. Use "self-hosted" or "hosted".`
  );
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

const askIntegrationModeQuestion = async ({
  defaultValue,
  rl,
}: {
  defaultValue: OpenDetailIntegrationMode;
  rl: readline.Interface;
}): Promise<OpenDetailIntegrationMode> => {
  const answer = await rl.question(
    `Integration mode (${defaultValue}, options: self-hosted/hosted): `
  );
  const trimmedAnswer = answer.trim();

  return parseIntegrationMode(
    trimmedAnswer.length > 0 ? trimmedAnswer : defaultValue
  );
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
  integrationMode,
  logger,
  mediaIncludePattern,
  routePath,
  withMedia,
}: {
  basePath: string;
  defaultShouldBuild: boolean;
  includePattern: string;
  integrationMode: OpenDetailIntegrationMode;
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
    logger.log("Step 1/6 · Integration");
    const resolvedIntegrationMode = await askIntegrationModeQuestion({
      defaultValue: integrationMode,
      rl,
    });

    logger.log("\nStep 2/6 · Content");
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

    logger.log("\nStep 3/6 · Media");
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

    logger.log("\nStep 4/6 · Route");
    const resolvedRoutePath =
      resolvedIntegrationMode === "self-hosted"
        ? await askQuestion({
            defaultValue: routePath,
            prompt: "Next.js route file path",
            rl,
          })
        : routePath;

    logger.log("\nStep 5/6 · Build");
    const resolvedShouldBuild = await askYesNoQuestion({
      defaultValue: defaultShouldBuild,
      prompt: "Build index after scaffolding",
      rl,
    });

    logger.log("\nStep 6/6 · Confirmed");
    return {
      basePath: resolvedBasePath,
      includePattern: resolvedIncludePattern,
      integrationMode: resolvedIntegrationMode,
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
  if (await pathExists(filePath)) {
    if (!force) {
      return "skipped";
    }

    await writeFile(filePath, content, "utf8");
    return "updated";
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return "created";
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
  const integrationMode = parseIntegrationMode(
    resolveStringFlag(flags, "integration")
  );

  const setupAnswers = shouldRunInteractiveSetup(flags)
    ? await promptSetupAnswers({
        basePath,
        defaultShouldBuild: !skipBuild,
        includePattern,
        integrationMode,
        logger,
        mediaIncludePattern,
        routePath: routePathValue,
        withMedia,
      })
    : {
        basePath,
        includePattern,
        integrationMode,
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

  logger.log(
    `${configResult === "skipped" ? "Skipped" : "Wrote"} ${path.relative(cwd, configPath)}`
  );

  if (setupAnswers.integrationMode === "self-hosted") {
    const routeResult = await writeIfMissing({
      content: createNextRouteTemplate(),
      filePath: path.resolve(cwd, setupAnswers.routePath),
      force,
    });

    logger.log(
      `${routeResult === "skipped" ? "Skipped" : "Wrote"} ${path.relative(cwd, path.resolve(cwd, setupAnswers.routePath))}`
    );
  } else {
    logger.log("Skipped route scaffolding for hosted integration.");
  }

  if (setupAnswers.shouldBuild) {
    await handleBuildCommand({ cwd, flags, logger });
  } else {
    logger.log("Skipped index build (--skip-build).");
  }

  logger.log(
    setupAnswers.integrationMode === "self-hosted"
      ? "Setup complete. Set OPENAI_API_KEY in your runtime environment."
      : `Hosted scaffolding complete. Next set ${HOSTED_ENDPOINT_ENV_VAR} in your app environment and configure transport headers if your hosted endpoint requires auth.`
  );
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
  const integrationMode = parseIntegrationMode(
    resolveStringFlag(flags, "integration")
  );
  const checks = [
    {
      exists: await pathExists(configPath),
      label: "Config",
      message: path.relative(cwd, configPath),
    },
    {
      exists: await pathExists(indexPath),
      label: "Index",
      message: path.relative(cwd, indexPath),
    },
  ];

  if (integrationMode === "self-hosted") {
    checks.push(
      {
        exists: await pathExists(routePath),
        label: "Route",
        message: path.relative(cwd, routePath),
      },
      {
        exists: hasNonEmptyEnvValue(process.env.OPENAI_API_KEY),
        label: "Env",
        message: "OPENAI_API_KEY",
      }
    );
  } else {
    checks.push({
      exists: hasNonEmptyEnvValue(process.env[HOSTED_ENDPOINT_ENV_VAR]),
      label: "Env",
      message: HOSTED_ENDPOINT_ENV_VAR,
    });
  }
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

const isMainModule =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  });
}
