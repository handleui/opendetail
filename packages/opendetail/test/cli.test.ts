import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
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

const createWorkspace = async ({
  contentDirectoryName = "content",
  dependencies,
}: {
  contentDirectoryName?: string;
  dependencies?: Record<string, string>;
} = {}): Promise<string> => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-cli-"));
  const contentDirectory = path.join(cwd, contentDirectoryName);

  await mkdir(contentDirectory, { recursive: true });
  await writeFile(
    path.join(contentDirectory, "getting-started.md"),
    "# Getting started\n\nUse `opendetail setup`.\n",
    "utf8"
  );

  if (dependencies) {
    await writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify(
        {
          name: "test-app",
          private: true,
          dependencies,
        },
        null,
        2
      ),
      "utf8"
    );
  }

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
  test("scaffolds fastest mode by default", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

    await runCli(["setup", "--cwd", cwd, "--no-interactive"], { logger });

    await expect(
      readFile(path.join(cwd, "src/app/api/opendetail/route.ts"), "utf8")
    ).resolves.toContain("createNextRoute");
    await expect(
      readFile(path.join(cwd, ".opendetail/index.json"), "utf8")
    ).resolves.toContain('"chunks"');
    expect(logger.logMock).toHaveBeenCalledWith("Detected setup mode: fastest");
  });

  test("skips route generation for headless mode by default", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

    await runCli(
      ["setup", "--cwd", cwd, "--no-interactive", "--mode", "headless"],
      { logger }
    );

    await expect(
      readFile(path.join(cwd, ".opendetail/index.json"), "utf8")
    ).resolves.toContain('"chunks"');
    await expect(
      readFile(path.join(cwd, "src/app/api/opendetail/route.ts"), "utf8")
    ).rejects.toThrow();
    expect(logger.logMock).toHaveBeenCalledWith("Skipped route generation.");
  });

  test("escapes TOML values in generated config", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

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

  test("detects docs roots in non-interactive setup when include is not explicit", async () => {
    const cwd = await createWorkspace({
      contentDirectoryName: "docs",
    });
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

    await runCli(["setup", "--cwd", cwd, "--no-interactive", "--skip-build"], {
      logger,
    });

    await expect(
      readFile(path.join(cwd, "opendetail.toml"), "utf8")
    ).resolves.toContain('include = ["docs/**/*.{md,mdx}"]');
  });

  test("doctor performs semantic checks for branded mode", async () => {
    const cwd = await createWorkspace({
      dependencies: {
        opendetail: "workspace:*",
        "opendetail-client": "workspace:*",
        "opendetail-next": "workspace:*",
      },
    });
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    await runCli(
      ["setup", "--cwd", cwd, "--no-interactive", "--mode", "branded"],
      { logger }
    );
    logger.logMock.mockClear();

    await runCli(["doctor", "--cwd", cwd, "--mode", "branded"], { logger });

    expect(logger.logMock).toHaveBeenCalledWith("✓ Mode: branded");
    expect(logger.logMock).toHaveBeenCalledWith(
      "Doctor summary: branded mode."
    );
  });

  test("doctor keeps optional routes in headless mode without reclassifying the setup", async () => {
    const cwd = await createWorkspace({
      dependencies: {
        opendetail: "workspace:*",
      },
    });
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    await runCli(
      [
        "setup",
        "--cwd",
        cwd,
        "--no-interactive",
        "--mode",
        "headless",
        "--route",
        "src/app/api/opendetail/route.ts",
      ],
      { logger }
    );
    logger.logMock.mockClear();

    await expect(
      runCli(["doctor", "--cwd", cwd, "--mode", "headless"], { logger })
    ).rejects.toThrow("OpenDetail doctor found setup issues.");
    expect(logger.logMock).toHaveBeenCalledWith("✓ Mode: headless");
    expect(logger.logMock).toHaveBeenCalledWith(
      "✗ Dependency: opendetail-next"
    );
  });

  test("doctor reports malformed package manifests as actionable checks", async () => {
    const cwd = await createWorkspace();
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);

    await writeFile(path.join(cwd, "package.json"), "{ invalid json", "utf8");

    await expect(runCli(["doctor", "--cwd", cwd], { logger })).rejects.toThrow(
      "OpenDetail doctor found setup issues."
    );
    expect(logger.logMock).toHaveBeenCalledWith(
      "✗ Manifest: Expected property name or '}' in JSON at position 2 (line 1 column 3)"
    );
  });

  test("verify can validate a live NDJSON endpoint", async () => {
    const cwd = await createWorkspace({
      dependencies: {
        opendetail: "workspace:*",
        "opendetail-client": "workspace:*",
        "opendetail-next": "workspace:*",
      },
    });
    const logger = createLogger();
    temporaryWorkspaces.push(cwd);
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    await runCli(
      ["setup", "--cwd", cwd, "--no-interactive", "--mode", "branded"],
      { logger }
    );
    logger.logMock.mockClear();

    const server = createServer((request, response) => {
      if (request.method !== "POST") {
        response.writeHead(405).end();
        return;
      }

      response.writeHead(200, {
        "content-type": "application/x-ndjson; charset=utf-8",
      });
      response.end(
        [
          JSON.stringify({
            model: "gpt-5.4-mini",
            type: "meta",
          }),
          JSON.stringify({
            sources: [],
            type: "sources",
          }),
          JSON.stringify({
            images: [],
            type: "images",
          }),
          JSON.stringify({
            text: "Ready.",
            type: "done",
          }),
        ].join("\n")
      );
    });

    const endpoint = await new Promise<string>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();

        if (!address || typeof address === "string") {
          reject(new Error("Server failed to bind."));
          return;
        }

        resolve(`http://127.0.0.1:${address.port}/api/opendetail`);
      });
    });

    try {
      await runCli(
        ["verify", "--cwd", cwd, "--mode", "branded", "--endpoint", endpoint],
        { logger }
      );
    } finally {
      server.close();
    }

    expect(logger.logMock).toHaveBeenCalledWith(
      "Verify summary: live endpoint passed with 4 stream events and terminal done."
    );
  });
});
