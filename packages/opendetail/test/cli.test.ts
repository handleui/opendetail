import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";

interface CapturedLogger {
  error: (...data: unknown[]) => void;
  errorMock: ReturnType<typeof vi.fn>;
  log: (...data: unknown[]) => void;
  logMock: ReturnType<typeof vi.fn>;
}

const createLogger = (): CapturedLogger => {
  const errorMock = vi.fn();
  const logMock = vi.fn();

  return {
    error: (...data: unknown[]) => {
      errorMock(...data);
    },
    errorMock,
    log: (...data: unknown[]) => {
      logMock(...data);
    },
    logMock,
  };
};

const createWorkspace = async (): Promise<string> => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-cli-"));
  const contentDirectory = path.join(cwd, "content");

  await mkdir(contentDirectory, { recursive: true });
  await writeFile(
    path.join(contentDirectory, "getting-started.md"),
    "# Getting started\n\nUse `opendetail setup`.\n",
    "utf8"
  );

  return cwd;
};

const temporaryWorkspaces: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();

  await Promise.all(
    temporaryWorkspaces
      .splice(0)
      .map((workspacePath) =>
        rm(workspacePath, { force: true, recursive: true })
      )
  );
});

describe("runCli", () => {
  test("scaffolds the self-hosted integration by default", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    await runCli(["setup", "--cwd", cwd, "--no-interactive"], { logger });

    await expect(
      readFile(path.join(cwd, "src/app/api/opendetail/route.ts"), "utf8")
    ).resolves.toContain("createNextRoute");
    await expect(
      readFile(path.join(cwd, ".opendetail/index.json"), "utf8")
    ).resolves.toContain('"chunks"');
    expect(logger.logMock).toHaveBeenCalledWith(
      "Setup complete. Make sure opendetail-next is installed and set OPENAI_API_KEY in your runtime environment."
    );
  });

  test("escapes TOML values in generated config", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    await runCli(
      [
        "setup",
        "--cwd",
        cwd,
        "--no-interactive",
        "--base-path",
        '/docs/"quoted"\nnext',
        "--include",
        'content/**/*.{md,mdx}"tail',
        "--skip-build",
      ],
      { logger }
    );

    await expect(
      readFile(path.join(cwd, "opendetail.toml"), "utf8")
    ).resolves.toContain('public_path = "/docs/\\"quoted\\"\\nnext"');
    await expect(
      readFile(path.join(cwd, "opendetail.toml"), "utf8")
    ).resolves.toContain('include = ["content/**/*.{md,mdx}\\"tail"]');
  });

  test("scaffolds hosted integration without generating a route", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

    await runCli(
      ["setup", "--cwd", cwd, "--integration", "hosted", "--no-interactive"],
      { logger }
    );

    await expect(
      readFile(path.join(cwd, ".opendetail/index.json"), "utf8")
    ).resolves.toContain('"chunks"');
    await expect(
      access(path.join(cwd, "src/app/api/opendetail/route.ts"))
    ).rejects.toBeDefined();
    expect(logger.logMock).toHaveBeenCalledWith(
      "Skipped route scaffolding for hosted integration."
    );
    expect(logger.logMock).toHaveBeenCalledWith(
      "Hosted scaffolding complete. Next set OPENDETAIL_ENDPOINT in your app environment and configure transport headers if your hosted endpoint requires auth."
    );
  });

  test("validates hosted diagnostics without requiring a route or OPENAI_API_KEY", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENDETAIL_ENDPOINT", "https://api.example.com/opendetail");

    await runCli(
      ["setup", "--cwd", cwd, "--integration", "hosted", "--no-interactive"],
      { logger }
    );

    await expect(
      runCli(["doctor", "--cwd", cwd, "--integration", "hosted"], { logger })
    ).resolves.toBeUndefined();
  });

  test("fails hosted diagnostics when OPENDETAIL_ENDPOINT is blank", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENDETAIL_ENDPOINT", "   ");

    await runCli(
      ["setup", "--cwd", cwd, "--integration", "hosted", "--no-interactive"],
      { logger }
    );

    await expect(
      runCli(["doctor", "--cwd", cwd, "--integration", "hosted"], { logger })
    ).rejects.toThrow("OpenDetail doctor found setup issues.");
  });
});
