#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  text,
} from "@clack/prompts";
import fg from "fast-glob";
import { buildOpenDetailIndex } from "./build";
import { isPrimaryModuleInvocation } from "./cli-invocation";
import { readOpenDetailConfig, resolveConfigPath } from "./config";
import { OPENDETAIL_CONFIG_FILE, OPENDETAIL_INDEX_FILE } from "./constants";
import { parseOpenDetailIndexArtifact } from "./search";
import type { OpenDetailConfig, OpenDetailStreamEvent } from "./types";
import { getErrorMessage } from "./utils";

const DEFAULT_ROUTE_PATH = "src/app/api/opendetail/route.ts";
const DEFAULT_DOCS_INCLUDE_PATTERN = "content/**/*.{md,mdx}";
const DEFAULT_MEDIA_INCLUDE_PATTERN =
  "content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}";
const DEFAULT_SAMPLE_QUESTION = "How do I install this?";
const PACKAGE_MANIFEST_FILE = "package.json";

const KNOWN_CONTENT_ROOTS = [
  "content",
  "docs",
  "src/content",
  "src/docs",
  "app/content",
  "app/docs",
  "content/docs",
] as const;

type CliLogger = Pick<typeof console, "error" | "log">;
type SetupMode = "branded" | "fastest" | "headless";

interface CliContext {
  logger: CliLogger;
}

interface ParsedCliArgs {
  command: string | null;
  flags: Map<string, string | true>;
}

interface ContentRootAnswer {
  includePattern: string;
  publicPath: string;
}

interface SetupAnswers {
  contentRoots: ContentRootAnswer[];
  mediaIncludePattern: string;
  mode: SetupMode;
  routePath: string;
  shouldBuild: boolean;
  shouldGenerateRoute: boolean;
  withMedia: boolean;
}

interface DoctorCheck {
  fix?: string;
  label: string;
  message: string;
  ok: boolean;
}

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface WorkspaceManifestResult {
  error: string | null;
  manifest: PackageManifest | null;
}

interface VerifySummary {
  eventCount: number;
  terminalType: "done" | "error";
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

const parseModeFlag = (flags: Map<string, string | true>): SetupMode | null => {
  const mode = resolveStringFlag(flags, "mode");

  if (mode === null) {
    return null;
  }

  if (mode === "fastest" || mode === "branded" || mode === "headless") {
    return mode;
  }

  throw new Error(
    `Invalid --mode value "${mode}". Use fastest, branded, or headless.`
  );
};

const printUsage = (): void => {
  console.log(`Usage:
  opendetail build [--config <path>] [--output <path>] [--cwd <path>]
  opendetail setup [--mode <fastest|branded|headless>] [--config <path>] [--route <path>] [--base-path <url>] [--include <glob>] [--media-include <glob>] [--with-media] [--skip-build] [--force] [--interactive] [--no-interactive] [--cwd <path>]
  opendetail doctor [--mode <fastest|branded|headless>] [--config <path>] [--route <path>] [--cwd <path>]
  opendetail verify [--mode <fastest|branded|headless>] [--config <path>] [--route <path>] [--endpoint <url>] [--sample-question <text>] [--cwd <path>]

Examples:
  bunx opendetail setup --mode fastest
  bunx opendetail setup --mode branded --with-media
  bunx opendetail doctor --mode headless
  bunx opendetail verify --endpoint http://localhost:3000/api/opendetail
  opendetail build`);
};

const escapeTomlString = (value: string): string =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");

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

const unwrapPromptResult = async <TValue>(
  pendingValue: Promise<TValue> | TValue
): Promise<TValue> => {
  const value = await pendingValue;

  if (isCancel(value)) {
    cancel("Setup cancelled.");
    throw new Error("Setup cancelled.");
  }

  return value;
};

const unwrapTextPromptResult = async (
  pendingValue: Promise<string | symbol> | string | symbol
): Promise<string> => (await unwrapPromptResult(pendingValue)) as string;

const unwrapConfirmPromptResult = async (
  pendingValue: Promise<boolean | symbol> | boolean | symbol
): Promise<boolean> => (await unwrapPromptResult(pendingValue)) as boolean;

const unwrapModePromptResult = async (
  pendingValue: Promise<SetupMode | symbol> | SetupMode | symbol
): Promise<SetupMode> => (await unwrapPromptResult(pendingValue)) as SetupMode;

const getRequiredPackages = (mode: SetupMode): string[] => {
  if (mode === "fastest") {
    return ["opendetail", "opendetail-next", "opendetail-react"];
  }

  if (mode === "branded") {
    return ["opendetail", "opendetail-client", "opendetail-next"];
  }

  return ["opendetail"];
};

const inferNonInteractiveContentRoots = async ({
  basePath,
  cwd,
  includePattern,
  includeWasExplicit,
}: {
  basePath: string;
  cwd: string;
  includePattern: string;
  includeWasExplicit: boolean;
}): Promise<ContentRootAnswer[]> => {
  if (includeWasExplicit) {
    return [
      {
        includePattern,
        publicPath: basePath,
      },
    ];
  }

  const detectedRoots = await detectLikelyContentRoots(cwd);

  if (detectedRoots.length === 0) {
    return [
      {
        includePattern,
        publicPath: basePath,
      },
    ];
  }

  if (basePath === "/docs") {
    return detectedRoots;
  }

  return detectedRoots.map((root) => ({
    includePattern: root.includePattern,
    publicPath: basePath,
  }));
};

const createConfigTemplate = ({
  contentRoots,
  mediaIncludePattern,
  withMedia,
}: {
  contentRoots: ContentRootAnswer[];
  mediaIncludePattern: string;
  withMedia: boolean;
}): string =>
  `version = 1
${contentRoots
  .map(
    (root) => `

[[content]]
include = ["${escapeTomlString(root.includePattern)}"]
exclude = []
public_path = "${escapeTomlString(root.publicPath)}"`
  )
  .join("")}
${
  withMedia
    ? `

[media]
include = ["${escapeTomlString(mediaIncludePattern)}"]
exclude = []
public_path = "/content-media"`
    : ""
}
`;

const createNextRouteTemplate = (): string =>
  `import { createNextRoute } from "opendetail-next";

export const { POST, runtime } = createNextRoute();
`;

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

const formatWorkspacePath = (cwd: string, targetPath: string): string =>
  path.relative(cwd, targetPath) || ".";

const inferPublicPathForPattern = (includePattern: string): string => {
  const normalizedPattern = includePattern.replaceAll("\\", "/");

  if (
    normalizedPattern.includes("/docs") ||
    normalizedPattern.startsWith("docs")
  ) {
    return "/docs";
  }

  return "/docs";
};

const detectLikelyContentRoots = async (
  cwd: string
): Promise<ContentRootAnswer[]> => {
  const detectedRoots: ContentRootAnswer[] = [];

  for (const directory of KNOWN_CONTENT_ROOTS) {
    const absoluteDirectory = path.resolve(cwd, directory);

    if (!(await pathExists(absoluteDirectory))) {
      continue;
    }

    const includePattern = `${directory}/**/*.{md,mdx}`;
    const matches = await fg(includePattern, {
      cwd,
      onlyFiles: true,
      unique: true,
    });

    if (matches.length === 0) {
      continue;
    }

    detectedRoots.push({
      includePattern,
      publicPath: inferPublicPathForPattern(includePattern),
    });
  }

  return detectedRoots;
};

const promptForContentRoots = async ({
  cwd,
  fallbackBasePath,
  fallbackIncludePattern,
}: {
  cwd: string;
  fallbackBasePath: string;
  fallbackIncludePattern: string;
}): Promise<ContentRootAnswer[]> => {
  const detectedRoots = await detectLikelyContentRoots(cwd);

  if (detectedRoots.length > 0) {
    note(
      detectedRoots
        .map((root) => `- ${root.includePattern} -> ${root.publicPath}`)
        .join("\n"),
      "Detected content roots"
    );

    const selectedRoots: ContentRootAnswer[] = [];

    for (const [index, root] of detectedRoots.entries()) {
      const shouldInclude = await unwrapConfirmPromptResult(
        confirm({
          initialValue: index === 0,
          message: `Include ${root.includePattern}?`,
        })
      );

      if (!shouldInclude) {
        continue;
      }

      const publicPath = await unwrapTextPromptResult(
        text({
          initialValue: root.publicPath,
          message: `Public URL prefix for ${root.includePattern}`,
          placeholder: "/docs",
          validate: (value) =>
            value.trim().startsWith("/")
              ? undefined
              : "Public paths must start with /",
        })
      );

      selectedRoots.push({
        includePattern: root.includePattern,
        publicPath: publicPath.trim(),
      });
    }

    if (selectedRoots.length > 0) {
      return selectedRoots;
    }
  }

  const includePattern = await unwrapTextPromptResult(
    text({
      initialValue: fallbackIncludePattern,
      message: "Docs include glob",
      placeholder: DEFAULT_DOCS_INCLUDE_PATTERN,
      validate: (value) =>
        value.trim().length > 0 ? undefined : "Include glob is required.",
    })
  );
  const publicPath = await unwrapTextPromptResult(
    text({
      initialValue: fallbackBasePath,
      message: "Public URL prefix for generated source URLs",
      placeholder: "/docs",
      validate: (value) =>
        value.trim().startsWith("/")
          ? undefined
          : "Public paths must start with /",
    })
  );

  return [
    {
      includePattern: includePattern.trim(),
      publicPath: publicPath.trim(),
    },
  ];
};

const promptSetupAnswers = async ({
  basePath,
  cwd,
  defaultMode,
  defaultShouldBuild,
  includePattern,
  logger,
  mediaIncludePattern,
  routePath,
  withMedia,
}: {
  basePath: string;
  cwd: string;
  defaultMode: SetupMode;
  defaultShouldBuild: boolean;
  includePattern: string;
  logger: CliLogger;
  mediaIncludePattern: string;
  routePath: string;
  withMedia: boolean;
}): Promise<SetupAnswers> => {
  logger.log("Setup wizard\n");
  intro("OpenDetail setup");

  const mode = await unwrapModePromptResult(
    select({
      initialValue: defaultMode,
      message: "Which adoption path are you setting up?",
      options: [
        {
          label: "Fastest",
          value: "fastest",
        },
        {
          label: "Branded",
          value: "branded",
        },
        {
          label: "Headless",
          value: "headless",
        },
      ],
    })
  );
  const contentRoots = await promptForContentRoots({
    cwd,
    fallbackBasePath: basePath,
    fallbackIncludePattern: includePattern,
  });
  const resolvedWithMedia = await unwrapConfirmPromptResult(
    confirm({
      initialValue: withMedia,
      message: "Enable local media mapping?",
    })
  );
  const resolvedMediaIncludePattern = resolvedWithMedia
    ? await unwrapTextPromptResult(
        text({
          initialValue: mediaIncludePattern,
          message: "Media include glob",
          placeholder: DEFAULT_MEDIA_INCLUDE_PATTERN,
          validate: (value) =>
            value.trim().length > 0 ? undefined : "Media glob is required.",
        })
      )
    : mediaIncludePattern;
  const shouldGenerateRoute = await unwrapConfirmPromptResult(
    confirm({
      initialValue: mode !== "headless",
      message:
        mode === "headless"
          ? "Generate a Next.js route anyway?"
          : "Generate the default Next.js route?",
    })
  );
  const resolvedRoutePath = shouldGenerateRoute
    ? await unwrapTextPromptResult(
        text({
          initialValue: routePath,
          message: "Next.js route file path",
          placeholder: DEFAULT_ROUTE_PATH,
          validate: (value) =>
            value.trim().length > 0 ? undefined : "Route path is required.",
        })
      )
    : routePath;
  const shouldBuild = await unwrapConfirmPromptResult(
    confirm({
      initialValue: defaultShouldBuild,
      message: "Build the index now?",
    })
  );

  outro(`Configured ${mode} setup.`);

  return {
    contentRoots,
    mediaIncludePattern: resolvedMediaIncludePattern.trim(),
    mode,
    routePath: resolvedRoutePath.trim(),
    shouldBuild,
    shouldGenerateRoute,
    withMedia: resolvedWithMedia,
  };
};

const readWorkspaceManifest = async (
  cwd: string
): Promise<WorkspaceManifestResult> => {
  const manifestPath = path.resolve(cwd, PACKAGE_MANIFEST_FILE);

  if (!(await pathExists(manifestPath))) {
    return {
      error: null,
      manifest: null,
    };
  }

  try {
    const manifestFile = await readFile(manifestPath, "utf8");
    const parsedManifest = JSON.parse(manifestFile) as PackageManifest;

    return {
      error: null,
      manifest: parsedManifest,
    };
  } catch (error) {
    return {
      error: getErrorMessage(error),
      manifest: null,
    };
  }
};

const manifestHasDependency = (
  manifest: PackageManifest | null,
  dependencyName: string
): boolean =>
  Boolean(
    manifest?.dependencies?.[dependencyName] ??
      manifest?.devDependencies?.[dependencyName]
  );

const detectSetupMode = ({
  explicitMode,
  manifest,
}: {
  explicitMode: SetupMode | null;
  manifest: PackageManifest | null;
}): SetupMode => {
  if (explicitMode !== null) {
    return explicitMode;
  }

  if (manifestHasDependency(manifest, "opendetail-react")) {
    return "fastest";
  }

  if (
    manifestHasDependency(manifest, "opendetail-client") ||
    manifestHasDependency(manifest, "opendetail-next")
  ) {
    return "branded";
  }

  return "headless";
};

const routeImportsOpenDetailNext = async (
  routePath: string
): Promise<boolean> => {
  if (!(await pathExists(routePath))) {
    return false;
  }

  const routeFile = await readFile(routePath, "utf8");
  return routeFile.includes(`"opendetail-next"`);
};

const collectContentChecks = async ({
  config,
  cwd,
}: {
  config: OpenDetailConfig;
  cwd: string;
}): Promise<DoctorCheck[]> => {
  const checks: DoctorCheck[] = [];

  for (const [index, root] of config.content.entries()) {
    const matches = await fg(root.include, {
      cwd,
      ignore: root.exclude,
      onlyFiles: true,
      unique: true,
    });

    checks.push({
      fix: "Adjust [[content]] include/exclude globs so at least one Markdown or MDX file matches.",
      label: `Content ${index + 1}`,
      message: `${root.include.join(", ")} -> ${matches.length} matched file${matches.length === 1 ? "" : "s"}`,
      ok: matches.length > 0,
    });
  }

  return checks;
};

const collectDependencyChecks = ({
  manifest,
  routeNeedsNextDependency,
  mode,
}: {
  manifest: PackageManifest | null;
  routeNeedsNextDependency: boolean;
  mode: SetupMode;
}): DoctorCheck[] => {
  if (manifest === null) {
    return [
      {
        fix: `Add ${PACKAGE_MANIFEST_FILE} so OpenDetail can verify the packages required for ${mode} mode.`,
        label: "Dependencies",
        message: PACKAGE_MANIFEST_FILE,
        ok: false,
      },
    ];
  }

  const requiredPackages = new Set(getRequiredPackages(mode));

  if (routeNeedsNextDependency) {
    requiredPackages.add("opendetail-next");
  }

  return [...requiredPackages].map((dependencyName) => ({
    fix: `Install ${dependencyName} for ${mode} mode.`,
    label: "Dependency",
    message: dependencyName,
    ok: manifestHasDependency(manifest, dependencyName),
  }));
};

const collectDoctorChecks = async ({
  configPath,
  cwd,
  flags,
}: {
  configPath: string;
  cwd: string;
  flags: Map<string, string | true>;
}): Promise<{
  checks: DoctorCheck[];
  config: OpenDetailConfig | null;
  mode: SetupMode;
}> => {
  const routePath = path.resolve(
    cwd,
    resolveStringFlag(flags, "route") ?? DEFAULT_ROUTE_PATH
  );
  const indexPath = path.resolve(cwd, OPENDETAIL_INDEX_FILE);
  const routeExists = await pathExists(routePath);
  const manifestResult = await readWorkspaceManifest(cwd);
  const manifest = manifestResult.manifest;
  const mode = detectSetupMode({
    explicitMode: parseModeFlag(flags),
    manifest,
  });
  const routeNeedsNextDependency = await routeImportsOpenDetailNext(routePath);

  const checks: DoctorCheck[] = [
    {
      label: "Mode",
      message: mode,
      ok: true,
    },
  ];

  if (manifestResult.error) {
    checks.push({
      fix: `Repair ${PACKAGE_MANIFEST_FILE} so OpenDetail can inspect workspace dependencies.`,
      label: "Manifest",
      message: manifestResult.error,
      ok: false,
    });
  }

  let config: OpenDetailConfig | null = null;

  try {
    config = await readOpenDetailConfig({
      configPath: path.relative(cwd, configPath),
      cwd,
    });
    checks.push({
      label: "Config",
      message: formatWorkspacePath(cwd, configPath),
      ok: true,
    });
    checks.push(...(await collectContentChecks({ config, cwd })));
  } catch (error) {
    checks.push({
      fix: `Run \`opendetail setup --mode ${mode}\` or repair ${formatWorkspacePath(cwd, configPath)}.`,
      label: "Config",
      message: getErrorMessage(error),
      ok: false,
    });
  }

  if (await pathExists(indexPath)) {
    try {
      const indexFile = await readFile(indexPath, "utf8");
      const artifact = parseOpenDetailIndexArtifact(JSON.parse(indexFile));

      checks.push({
        label: "Index",
        message: `${formatWorkspacePath(cwd, indexPath)} (${artifact.chunks.length} chunk${artifact.chunks.length === 1 ? "" : "s"})`,
        ok: true,
      });
    } catch (error) {
      checks.push({
        fix: "Run `opendetail build` to regenerate the index.",
        label: "Index",
        message: getErrorMessage(error),
        ok: false,
      });
    }
  } else {
    checks.push({
      fix: "Run `opendetail build` to generate the local index.",
      label: "Index",
      message: formatWorkspacePath(cwd, indexPath),
      ok: false,
    });
  }

  if (mode === "headless") {
    checks.push({
      label: "Route",
      message: routeExists
        ? `${formatWorkspacePath(cwd, routePath)} (optional)`
        : "not required for headless mode",
      ok: true,
    });
  } else {
    checks.push({
      fix: `Generate the route with \`opendetail setup --mode ${mode}\` or add ${formatWorkspacePath(cwd, routePath)}.`,
      label: "Route",
      message: formatWorkspacePath(cwd, routePath),
      ok: routeExists,
    });
  }

  checks.push({
    fix: "Set OPENAI_API_KEY where the route or runtime executes.",
    label: "Env",
    message: "OPENAI_API_KEY",
    ok: hasNonEmptyEnvValue(process.env.OPENAI_API_KEY),
  });
  checks.push(
    ...collectDependencyChecks({
      manifest,
      mode,
      routeNeedsNextDependency,
    })
  );

  return { checks, config, mode };
};

const createSetupNextSteps = ({
  mode,
  routeGenerated,
}: {
  mode: SetupMode;
  routeGenerated: boolean;
}): string => {
  if (mode === "fastest") {
    return [
      "Install or confirm: opendetail, opendetail-next, opendetail-react.",
      routeGenerated
        ? "Use AssistantSidebar or useOpenDetail against /api/opendetail."
        : "Add a Next.js route before wiring the preset UI.",
      "Re-run `opendetail build` whenever docs change.",
    ].join("\n");
  }

  if (mode === "branded") {
    return [
      "Install or confirm: opendetail, opendetail-next, opendetail-client.",
      routeGenerated
        ? "Build your own UI against the NDJSON stream exposed by /api/opendetail."
        : "Add a backend route before wiring your custom client.",
      "Re-run `opendetail build` whenever docs change.",
    ].join("\n");
  }

  return [
    "Install or confirm: opendetail.",
    "Use createOpenDetail from Node or point a custom client at your chosen backend.",
    routeGenerated
      ? "A route was generated, but it is optional in headless mode."
      : "Add a route only if you want HTTP access from a frontend or external client.",
  ].join("\n");
};

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
  const includeWasExplicit = flags.has("include");
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
  const defaultMode = parseModeFlag(flags) ?? "fastest";

  const setupAnswers = shouldRunInteractiveSetup(flags)
    ? await promptSetupAnswers({
        basePath,
        cwd,
        defaultMode,
        defaultShouldBuild: !skipBuild,
        includePattern,
        logger,
        mediaIncludePattern,
        routePath: routePathValue,
        withMedia,
      })
    : {
        contentRoots: await inferNonInteractiveContentRoots({
          basePath,
          cwd,
          includePattern,
          includeWasExplicit,
        }),
        mediaIncludePattern,
        mode: defaultMode,
        routePath: routePathValue,
        shouldBuild: !skipBuild,
        shouldGenerateRoute:
          defaultMode === "headless" ? flags.has("route") : true,
        withMedia,
      };

  const configResult = await writeIfMissing({
    content: createConfigTemplate({
      contentRoots: setupAnswers.contentRoots,
      mediaIncludePattern: setupAnswers.mediaIncludePattern,
      withMedia: setupAnswers.withMedia,
    }),
    filePath: configPath,
    force,
  });

  logger.log(
    `${configResult === "skipped" ? "Skipped" : "Wrote"} ${formatWorkspacePath(cwd, configPath)}`
  );

  if (setupAnswers.shouldGenerateRoute) {
    const resolvedRoutePath = path.resolve(cwd, setupAnswers.routePath);
    const routeResult = await writeIfMissing({
      content: createNextRouteTemplate(),
      filePath: resolvedRoutePath,
      force,
    });

    logger.log(
      `${routeResult === "skipped" ? "Skipped" : "Wrote"} ${formatWorkspacePath(cwd, resolvedRoutePath)}`
    );
  } else {
    logger.log("Skipped route generation.");
  }

  if (setupAnswers.shouldBuild) {
    await handleBuildCommand({ cwd, flags, logger });
  } else {
    logger.log("Skipped index build (--skip-build).");
  }

  logger.log(`Detected setup mode: ${setupAnswers.mode}`);
  logger.log(
    createSetupNextSteps({
      mode: setupAnswers.mode,
      routeGenerated: setupAnswers.shouldGenerateRoute,
    })
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
  const configPath = resolveConfigPath(
    cwd,
    resolveStringFlag(flags, "config") ?? undefined
  );
  const { checks, mode } = await collectDoctorChecks({
    configPath,
    cwd,
    flags,
  });
  let hasFailure = false;

  for (const check of checks) {
    const prefix = check.ok ? "✓" : "✗";

    if (!check.ok) {
      hasFailure = true;
    }

    logger.log(`${prefix} ${check.label}: ${check.message}`);

    if (!check.ok && check.fix) {
      logger.log(`  Fix: ${check.fix}`);
    }
  }

  logger.log(`Doctor summary: ${mode} mode.`);

  if (hasFailure) {
    throw new Error("OpenDetail doctor found setup issues.");
  }
};

const parseVerifyEvents = (body: string): OpenDetailStreamEvent[] =>
  body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as OpenDetailStreamEvent);

const validateVerifyEvents = (
  events: OpenDetailStreamEvent[]
): VerifySummary => {
  if (events.length === 0) {
    throw new Error("Verify received an empty NDJSON response.");
  }

  const firstEvent = events[0];

  if (firstEvent?.type !== "meta") {
    throw new Error("Verify expected the first stream event to be `meta`.");
  }

  const sourcesIndex = events.findIndex((event) => event.type === "sources");
  const imagesIndex = events.findIndex((event) => event.type === "images");
  const terminalEvents = events.filter(
    (event) => event.type === "done" || event.type === "error"
  );

  if (sourcesIndex < 0) {
    throw new Error("Verify expected a `sources` event.");
  }

  if (imagesIndex < 0) {
    throw new Error("Verify expected an `images` event.");
  }

  if (sourcesIndex < 1 || imagesIndex <= sourcesIndex) {
    throw new Error(
      "Verify expected `sources` before `images`, before any terminal event."
    );
  }

  if (terminalEvents.length !== 1) {
    throw new Error(
      "Verify expected exactly one terminal `done` or `error` event."
    );
  }

  const lastEvent = events.at(-1);

  if (lastEvent?.type !== "done" && lastEvent?.type !== "error") {
    throw new Error("Verify expected the last stream event to be terminal.");
  }

  return {
    eventCount: events.length,
    terminalType: lastEvent.type,
  };
};

const runEndpointVerification = async ({
  endpoint,
  sampleQuestion,
}: {
  endpoint: string;
  sampleQuestion: string;
}): Promise<VerifySummary> => {
  const response = await fetch(endpoint, {
    body: JSON.stringify({
      question: sampleQuestion,
    }),
    headers: {
      accept: "application/x-ndjson, application/json",
      "content-type": "application/json",
    },
    method: "POST",
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (contentType.includes("application/json")) {
    throw new Error(
      `Verify expected NDJSON but received JSON: ${body || response.statusText}`
    );
  }

  if (!contentType.includes("application/x-ndjson")) {
    throw new Error(
      `Verify expected application/x-ndjson but received ${contentType || "an unknown content type"}.`
    );
  }

  if (!response.ok) {
    throw new Error(`Verify request failed with status ${response.status}.`);
  }

  return validateVerifyEvents(parseVerifyEvents(body));
};

const handleVerifyCommand = async ({
  cwd,
  flags,
  logger,
}: {
  cwd: string;
  flags: Map<string, string | true>;
  logger: CliLogger;
}): Promise<void> => {
  const configPath = resolveConfigPath(
    cwd,
    resolveStringFlag(flags, "config") ?? undefined
  );
  const { checks, mode } = await collectDoctorChecks({
    configPath,
    cwd,
    flags,
  });
  const failingChecks = checks.filter((check) => !check.ok);

  for (const check of checks) {
    const prefix = check.ok ? "✓" : "✗";
    logger.log(`${prefix} ${check.label}: ${check.message}`);

    if (!check.ok && check.fix) {
      logger.log(`  Fix: ${check.fix}`);
    }
  }

  if (failingChecks.length > 0) {
    throw new Error(
      "OpenDetail verify found setup issues before exercising the endpoint."
    );
  }

  const endpoint = resolveStringFlag(flags, "endpoint");

  if (endpoint === null) {
    logger.log(
      `Verify summary: ${mode} mode is structurally ready. Pass --endpoint to exercise the live NDJSON stream.`
    );
    return;
  }

  const sampleQuestion =
    resolveStringFlag(flags, "sample-question") ?? DEFAULT_SAMPLE_QUESTION;
  const summary = await runEndpointVerification({
    endpoint,
    sampleQuestion,
  });

  logger.log(
    `Verify summary: live endpoint passed with ${summary.eventCount} stream event${summary.eventCount === 1 ? "" : "s"} and terminal ${summary.terminalType}.`
  );
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

  if (command === "verify") {
    await handleVerifyCommand({
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

if (isPrimaryModuleInvocation(import.meta.url)) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  });
}
