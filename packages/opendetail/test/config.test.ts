import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { readOpenDetailConfig } from "../src/config";
import { removeWorkspace } from "./helpers";

describe("readOpenDetailConfig", () => {
  test("parses and normalizes the MVP config file", async () => {
    const cwd = path.resolve(import.meta.dirname, "fixtures", "basic");

    await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
      base_path: "/docs",
      exclude: [],
      include: ["content/**/*.md", "content/**/*.mdx"],
      version: 1,
    });
  });

  test("parses optional media config", async () => {
    const cwd = path.resolve(import.meta.dirname, "fixtures", "media");

    await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
      base_path: "/docs",
      exclude: [],
      include: ["content/**/*.md", "content/**/*.mdx"],
      media: {
        base_path: "/content-media",
        exclude: [],
        include: ["content/**/*.{png,webp,svg}"],
      },
      version: 1,
    });
  });

  test("rejects invalid config values", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-config-"));

    try {
      await writeFile(
        path.join(cwd, "opendetail.toml"),
        `version = 2
include = []
exclude = []
base_path = "docs"
`
      );

      await expect(readOpenDetailConfig({ cwd })).rejects.toThrow(
        "Invalid OpenDetail config"
      );
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
